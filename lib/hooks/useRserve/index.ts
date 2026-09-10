import { useEffect, useRef, useSyncExternalStore } from "react";
import RserveClient from "rserve-ts";
import { z } from "zod";

type RserveOptions = Parameters<(typeof RserveClient)["create"]>[0];
type RserveConnection = Awaited<ReturnType<(typeof RserveClient)["create"]>>;
type AppType<T extends z.ZodRawShape> = z.infer<z.ZodObject<T, "strip">>;

export type RserveConnectionStatus = "connected" | "connecting" | "disconnected";

export type RserveApp<T> = {
  app?: T;
  isConnecting: boolean;
  error?: string;
};

const defaultConfig = {
  host: "http://localhost:6311",
};

const RETRY_BASE_MS = 1_000;
const RETRY_MAX_MS = 10_000;
const HEARTBEAT_INTERVAL_MS = 1_500;
const HEARTBEAT_TIMEOUT_MS = 1_500;

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (Array.isArray(error)) return error.map(formatError).join(" ");
  return String(error);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Connection timed out"));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

type PingOcap = () => Promise<unknown>;

class RServeStore<T extends z.ZodRawShape> {
  private schema: T;
  private config: RserveOptions;
  private client: RserveConnection | undefined;
  private socket: WebSocket | undefined;
  private pingOcap: PingOcap | undefined;
  private app: AppType<T> | undefined;
  private loading = false;
  private error: string | undefined;
  private connectionStatus: RserveConnectionStatus = "connecting";
  private everConnected = false;
  private reconnectAttempt = 0;
  private retryTimeoutId: ReturnType<typeof setTimeout> | undefined;
  private heartbeatIntervalId: ReturnType<typeof setInterval> | undefined;
  private heartbeatInFlight = false;
  private suppressCloseHandler = false;
  private destroyed = false;

  private listeners = new Set<() => void>();
  private snapshot: {
    app: AppType<T> | undefined;
    loading: boolean;
    error: string | undefined;
    connectionStatus: RserveConnectionStatus;
    everConnected: boolean;
    reconnectAttempt: number;
  };

  constructor(schema: T, config?: Partial<RserveOptions>) {
    this.schema = schema;
    this.config = {
      ...defaultConfig,
      ...config,
      on_socket: (socket) => {
        config?.on_socket?.(socket);
        this.socket = socket;
      },
      on_connect: () => {
        config?.on_connect?.();
      },
      on_close: (event) => {
        config?.on_close?.(event);
        if (this.suppressCloseHandler) return;
        this.handleDisconnect();
      },
    };
    this.snapshot = this.buildSnapshot();
    this.connect();
  }

  isDestroyed() {
    return this.destroyed;
  }

  private buildSnapshot() {
    return {
      app: this.app,
      loading: this.loading,
      error: this.error,
      connectionStatus: this.connectionStatus,
      everConnected: this.everConnected,
      reconnectAttempt: this.reconnectAttempt,
    };
  }

  private handleDisconnect() {
    if (this.destroyed) return;
    if (this.connectionStatus === "disconnected" && this.retryTimeoutId != null) {
      return;
    }

    this.stopHeartbeat();
    this.client = undefined;
    this.socket = undefined;
    this.pingOcap = undefined;
    clearTimeout(this.retryTimeoutId);
    this.connectionStatus = "disconnected";
    this.updateSnapshot();
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (this.destroyed) return;
    clearTimeout(this.retryTimeoutId);
    const delay = Math.min(
      RETRY_BASE_MS * 1.5 ** this.reconnectAttempt,
      RETRY_MAX_MS
    );
    this.retryTimeoutId = setTimeout(() => {
      this.reconnectAttempt += 1;
      this.connect();
    }, delay);
  }

  private teardownClient(options: { silent?: boolean } = {}) {
    this.stopHeartbeat();
    if (!this.client) return;

    const client = this.client;
    this.client = undefined;
    this.socket = undefined;
    this.pingOcap = undefined;
    if (options.silent) {
      this.suppressCloseHandler = true;
    }
    try {
      client.close();
    } catch {
      // ignore close errors on dead sockets
    }
    if (options.silent) {
      queueMicrotask(() => {
        this.suppressCloseHandler = false;
      });
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    void this.pulse();
    this.heartbeatIntervalId = setInterval(() => {
      void this.pulse();
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat() {
    clearInterval(this.heartbeatIntervalId);
    this.heartbeatIntervalId = undefined;
    this.heartbeatInFlight = false;
  }

  private isSocketOpen() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  private heartbeatProbe(): (() => Promise<unknown>) | undefined {
    if (this.pingOcap) {
      return this.pingOcap;
    }

    const client = this.client;
    if (!client) return undefined;

    if (client.is_ocap_mode()) {
      return undefined;
    }

    return () => client.eval("NULL");
  }

  private async pulse() {
    if (this.destroyed || this.connectionStatus !== "connected") {
      return;
    }
    if (this.heartbeatInFlight) {
      return;
    }

    const client = this.client;
    if (!client || !this.isSocketOpen() || client.is_closed()) {
      this.handleDisconnect();
      return;
    }

    const probe = this.heartbeatProbe();
    if (!probe) {
      return;
    }

    this.heartbeatInFlight = true;
    try {
      await withTimeout(probe(), HEARTBEAT_TIMEOUT_MS);
    } catch (e) {
      if (this.connectionStatus !== "connected") return;

      this.error = formatError(e);
      this.teardownClient({ silent: true });
      this.handleDisconnect();
    } finally {
      this.heartbeatInFlight = false;
    }
  }

  private connect() {
    if (this.destroyed) return;
    clearTimeout(this.retryTimeoutId);
    this.teardownClient({ silent: true });
    this.loading = true;
    this.connectionStatus = "connecting";
    this.error = undefined;
    this.updateSnapshot();

    RserveClient.create(this.config)
      .then((c) => {
        this.client = c;
        return c.ocap(this.schema);
      })
      .then((res) => {
        this.app = res as unknown as AppType<T>;
        const ping = (res as { ping?: PingOcap }).ping;
        this.pingOcap = typeof ping === "function" ? ping : undefined;
        this.connectionStatus = "connected";
        this.everConnected = true;
        this.reconnectAttempt = 0;
        this.startHeartbeat();
      })
      .catch((e) => {
        this.teardownClient({ silent: true });
        this.error = formatError(e);
        this.connectionStatus = "disconnected";
        this.scheduleReconnect();
      })
      .finally(() => {
        this.loading = false;
        this.updateSnapshot();
      });
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emitChange() {
    this.listeners.forEach((listener) => listener());
  }

  private updateSnapshot() {
    this.snapshot = this.buildSnapshot();
    this.emitChange();
  }

  get = () => this.snapshot;

  destroy = () => {
    if (this.destroyed) return;
    this.destroyed = true;
    clearTimeout(this.retryTimeoutId);
    this.teardownClient({ silent: true });
  };
}

export function useRserve<const TFuns extends z.ZodRawShape>(
  schema: TFuns,
  config?: Partial<RserveOptions>
) {
  const storeRef = useRef<RServeStore<TFuns>>(undefined);

  if (!storeRef.current || storeRef.current.isDestroyed()) {
    storeRef.current = new RServeStore(schema, config);
  }

  const store = storeRef.current;

  const state = useSyncExternalStore(store.subscribe, store.get);

  useEffect(() => {
    return () => {
      store.destroy();
    };
  }, [store]);

  return state;
}
