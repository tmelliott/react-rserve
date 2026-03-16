import { useEffect, useRef, useSyncExternalStore } from "react";

export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

type WidgetProperty<T = any, R = any> = {
  get: () => Promise<T>;
  set: (x: R) => Promise<void>;
  register: (
    f: (v: T, k: (err: string | null, res: null) => void) => void,
    id: string
  ) => Promise<string>;
};

type PropType<T extends WidgetProperty> = Awaited<ReturnType<T["get"]>>;
type ResultType<T extends WidgetProperty> = Parameters<T["set"]>[0];

type ActionStrictness = "off" | "warn" | "strict";

export type WidgetCapabilities = {
  actions: {
    enabled: boolean;
    types: string[];
    strict: ActionStrictness;
  };
};

export type WidgetActionState = WidgetCapabilities["actions"] & {
  canUndo: boolean;
  canRedo: boolean;
  actionCount: number;
};

type WidgetMethods = Record<string, { call: (...args: any[]) => Promise<unknown> }>;

type DispatchActionObject = {
  type: string;
  payload: unknown;
};

type DispatchActionFromMethod<D> = NonNullable<D> extends (
  action: infer A,
  ...args: any[]
) => Promise<unknown>
  ? A
  : NonNullable<D> extends {
        call: (action: infer A, ...args: any[]) => Promise<unknown>;
      }
    ? A
    : DispatchActionObject;

type DispatchActionInput<M extends WidgetMethods> = NonNullable<M> extends {
  dispatchAction?: infer D;
}
  ? DispatchActionFromMethod<D>
  : DispatchActionObject;

export type DispatchActionFn<M extends WidgetMethods> = {
  (action: DispatchActionInput<M>): Promise<unknown>;
  (type: string, payload: unknown): Promise<unknown>;
};

export type Widget<
  T extends Record<string, any>,
  M extends WidgetMethods = WidgetMethods,
> = {
  properties: {
    [K in Exclude<keyof T, "r_type" | "r_attributes">]: Expand<
      WidgetProperty<PropType<T[K]>, ResultType<T[K]>>
    >;
  };
  children?: Record<string, unknown>;
  methods?: M;
  capabilities?: WidgetCapabilities;
};

type WidgetState<P extends Record<string, any>> = Expand<{
  [K in Exclude<keyof P, "r_type" | "r_attributes">]:
    | Parameters<P[K]["set"]>[0];
}>;

export class WidgetStore<
  T extends Record<string, any>,
  M extends WidgetMethods = WidgetMethods,
> {
  private widget: Widget<T, M> | undefined;
  private ctor: (
    f: (
      v: Partial<Expand<WidgetState<T>>>,
      k: (err: string | null, res: null) => void
    ) => void
  ) => Promise<Widget<T, M>>;
  private status: WidgetStatus = "loading";
  private fields: Widget<T, M>["properties"] | undefined;
  private methods: M | undefined;
  private capabilities: WidgetCapabilities | undefined;
  private actionState: WidgetActionState | undefined;
  private state: WidgetState<T> | undefined;

  private timeoutRefs: Partial<
    Record<Exclude<keyof T, "r_type" | "r_attributes">, NodeJS.Timeout>
  >;
  private listeners = new Set<() => void>();

  private snapshot: {
    widget: Widget<T, M> | undefined;
    status: WidgetStatus;
    fields: Widget<T>["properties"] | undefined;
    methods: M | undefined;
    capabilities: WidgetCapabilities | undefined;
    actionState: WidgetActionState | undefined;
    state: WidgetState<T> | undefined;
  };

  constructor(
    ctor: (
      f: (
        v: Partial<Expand<WidgetState<T>>>,
        k: (err: string | null, res: null) => void
      ) => void
    ) => Promise<Widget<T, M>>
  ) {
    this.ctor = ctor;
    this.timeoutRefs = {};
    this.snapshot = {
      widget: this.widget,
      status: this.status,
      fields: this.fields,
      methods: this.methods,
      capabilities: this.capabilities,
      actionState: this.actionState,
      state: this.state,
    };
    this.init();
  }

  updateState(state: Partial<WidgetState<T>>) {
    this.state = {
      ...this.state,
      ...state,
    } as WidgetState<T>;
    this.updateSnapshot();
  }

  private async init() {
    const widget = await this.ctor((v, k) => {
      this.updateState(v as any);
      k(null, null);
    });
    this.widget = widget;
    this.fields = widget.properties;
    this.methods = widget.methods;
    this.capabilities = widget.capabilities;
    this.actionState = this.toActionState(widget.capabilities);
    this.status = "ready";

    this.updateSnapshot();
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
      widget: this.widget,
      fields: this.widget?.properties,
      methods: this.methods,
      capabilities: this.capabilities,
      actionState: this.actionState,
      status: this.status,
      state: this.state,
    };
    this.emitChange();
  }

  getSnapshot = () => {
    return this.snapshot;
  };

  set = <P extends Exclude<keyof T, "r_type" | "r_attributes">>(
    prop: P,
    value: ResultType<T[P]>,
    delay: number = 0
  ) => {
    if (
      this.capabilities?.actions.enabled &&
      this.capabilities.actions.strict === "warn"
    ) {
      console.warn(
        `[react-rserve] Direct set('${String(prop)}') used on action-enabled widget in warn mode. Prefer dispatchAction().`
      );
    }

    if (this.timeoutRefs[prop as string]) {
      clearTimeout(this.timeoutRefs[prop as string]);
    }

    this.timeoutRefs[prop] = setTimeout(() => {
      if (this.fields) this.fields[prop].set(value);
    }, delay);
  };

  dispatchAction = async (actionOrType: unknown, payloadArg?: unknown) => {
    let action: DispatchActionObject | undefined;
    let actionType = "";

    if (
      typeof actionOrType === "object" &&
      actionOrType !== null &&
      "type" in actionOrType &&
      typeof (actionOrType as { type: unknown }).type === "string"
    ) {
      actionType = (actionOrType as { type: string }).type;
      action = actionOrType as DispatchActionObject;
    } else if (typeof actionOrType === "string") {
      actionType = actionOrType;
      action = { type: actionType, payload: payloadArg };
    } else {
      throw new Error(
        "[react-rserve] dispatchAction expects either (actionObject) or (type, payload)."
      );
    }

    const actionCaps = this.capabilities?.actions;
    const declaredTypes = actionCaps?.types ?? [];
    const strictness = actionCaps?.strict ?? "off";
    const hasDeclaredTypes = declaredTypes.length > 0;
    const isUnknownType = hasDeclaredTypes && !declaredTypes.includes(actionType);

    if (isUnknownType) {
      const msg = `[react-rserve] dispatchAction('${actionType}') is not in declared capabilities.actions.types: [${declaredTypes.join(
        ", "
      )}]`;
      if (strictness === "strict") {
        throw new Error(msg);
      }
      if (strictness === "warn") {
        console.warn(msg);
      }
    }

    const fn = this.methods?.dispatchAction;
    if (fn?.call) {
      if (typeof actionOrType === "string") {
        try {
          return await fn.call(actionType, payloadArg);
        } catch {
          return fn.call(action);
        }
      }
      try {
        return await fn.call(action);
      } catch {
        return fn.call(actionType, action.payload);
      }
    }
    console.warn(
      `[react-rserve] dispatchAction('${actionType}') requested but widget has no dispatchAction method.`
    );
    return undefined;
  };

  undo = async () => {
    const fn = this.methods?.undo;
    if (fn?.call) {
      return fn.call();
    }
    console.warn(
      "[react-rserve] undo() requested but widget has no undo method."
    );
    return undefined;
  };

  redo = async () => {
    const fn = this.methods?.redo;
    if (fn?.call) {
      return fn.call();
    }
    console.warn(
      "[react-rserve] redo() requested but widget has no redo method."
    );
    return undefined;
  };

  private toActionState(
    capabilities: WidgetCapabilities | undefined
  ): WidgetActionState | undefined {
    const actions = capabilities?.actions;
    if (!actions) {
      return undefined;
    }
    return {
      ...actions,
      canUndo: false,
      canRedo: false,
      actionCount: 0,
    };
  }

  destroy() {
    if (this.timeoutRefs) {
      Object.keys(this.timeoutRefs).map((t) =>
        clearTimeout(this.timeoutRefs[t])
      );
    }
  }
}

export function useWidget<
  P extends Record<string, any>,
  M extends WidgetMethods = WidgetMethods,
>(
  ctor: (
    f: (
      v: Partial<Expand<WidgetState<P>>>,
      k: (err: string | null, res: null) => void
    ) => void
  ) => Promise<{
    properties: P;
    children?: Record<string, unknown>;
    methods?: M;
    capabilities?: WidgetCapabilities;
  }>
) {
  const storeRef = useRef<WidgetStore<P, M>>(undefined);

  if (!storeRef.current) {
    storeRef.current = new WidgetStore(ctor);
  }

  const state = useSyncExternalStore(
    storeRef.current.subscribe,
    storeRef.current.getSnapshot,
    storeRef.current.getSnapshot
  );

  useEffect(() => {
    return () => {
      storeRef.current?.destroy();
    };
  }, []);

  return {
    ...state,
    set: storeRef.current.set,
    dispatchAction: storeRef.current.dispatchAction as DispatchActionFn<M>,
    undo: storeRef.current.undo,
    redo: storeRef.current.redo,
  };
}

export type RWidget<T extends (fn: any) => any> = Expand<
  Widget<Awaited<ReturnType<T>>["properties"]>
>;

type WidgetStatus = "ready" | "loading" | "setting";
