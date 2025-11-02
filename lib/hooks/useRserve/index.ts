import { useEffect, useRef, useSyncExternalStore } from "react";
import RserveClient from "rserve-ts";
import { z } from "zod";

type RserveOptions = Parameters<(typeof RserveClient)["create"]>[0];
type AppType<T extends z.ZodRawShape> = z.infer<z.ZodObject<T, "strip">>;

export type RserveApp<T> = {
  app?: T;
  isConnecting: boolean;
  error?: string;
};

const defaultConfig = {
  host: "http://localhost:6311",
};

class RServeStore<T extends z.ZodRawShape> {
  // private con: Awaited<ReturnType<typeof RserveClient.create>> | undefined;
  private schema: T;
  private config: RserveOptions;
  private app: AppType<T> | undefined;
  private loading: boolean = false;
  private error: string | undefined;

  private listeners = new Set<() => void>();
  private snapshot: {
    app: AppType<T> | undefined;
    loading: boolean;
    error: string | undefined;
  };

  constructor(schema: T, config?: Partial<RserveOptions>) {
    console.log("CONSTRUCT", { config });
    this.schema = schema;
    this.config = {
      ...defaultConfig,
      ...config,
      on_close: (event) => {
        if (config && config.on_close) config.on_close(event);
        console.log("WebSocket disconnected ... reconnecting ...");
        this.init();
      },
    };
    this.loading = false;
    this.snapshot = {
      app: this.app,
      loading: this.loading,
      error: this.error,
    };
    this.init();
  }

  private init() {
    this.loading = true;
    this.updateSnapshot();

    RserveClient.create(this.config)
      .then((c) => {
        console.log(c);
        return c.ocap(this.schema);
      })
      .then((res) => {
        this.app = res as any;
      })
      .catch((e) => {
        this.error = e;
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
    this.snapshot = {
      app: this.app,
      loading: this.loading,
      error: this.error,
    };
    this.emitChange();
  }

  get = () => {
    return this.snapshot;
  };

  destroy = () => {};
}

export function useRserve<TFuns extends z.ZodRawShape>(
  schema: TFuns,
  config?: Partial<RserveOptions>
) {
  const storeRef = useRef<RServeStore<TFuns>>(undefined);

  if (!storeRef.current) {
    storeRef.current = new RServeStore(schema, config);
  }

  const state = useSyncExternalStore(
    storeRef.current.subscribe,
    storeRef.current.get
  );

  useEffect(() => {
    return () => storeRef.current?.destroy();
  });

  return state;

  // const [app, setApp] = useState<AppType<TFuns>>();
  // const [connecting, setConnecting] = useState(false);
  // const [error, setError] = useState<string>();

  // useEffect(() => {
  //   if (app) return;
  //   if (connecting) return;
  //   setConnecting(true);
  //   RserveClient.create({ ...defaultConfig, ...config })
  //     .then((con) => {
  //       console.log("Connected: ", con, schema);
  //       return con.ocap(schema);
  //     })
  //     .then((res) => {
  //       console.log("Loaded: ", res);
  //       setApp(res as any as AppType<TFuns>);
  //       setConnecting(false);
  //     })
  //     .catch((e) => {
  //       setApp(undefined);
  //       setError(e);
  //       setConnecting(false);
  //     });

  //   return () => {
  //     console.log("Unmounting ");
  //     setApp(undefined);
  //   };
  // }, [app, connecting, config, schema]);

  // return {
  //   app,
  //   loading: connecting,
  //   error,
  // };
}
