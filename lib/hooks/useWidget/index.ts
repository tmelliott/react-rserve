import { useEffect, useRef, useSyncExternalStore } from "react";

export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

type WidgetProperty<T = any, R = any> = {
  get: () => Promise<T>;
  set: (x: R) => Promise<void>;
  register: (
    f: (v: T, k: (err: string | null, res: null) => void) => void,
    id: string,
  ) => Promise<string>;
};

type PropType<T extends WidgetProperty> = Awaited<ReturnType<T["get"]>>;
type ResultType<T extends WidgetProperty> = Parameters<T["set"]>[0];

export type Widget<
  T extends Record<string, any>,
  C extends Record<string, any>,
  M extends Record<string, any> = Record<string, never>,
> = {
  properties: {
    [K in Exclude<keyof T, "r_type" | "r_attributes">]: Expand<
      WidgetProperty<PropType<T[K]>, ResultType<T[K]>>
    >;
  };
} & MaybeChildren<C> &
  MaybeMethods<M>;

type MaybeChildren<C extends Record<string, any>> = keyof Omit<
  C,
  "r_type" | "r_attributes"
> extends never
  ? Record<string, never>
  : {
      children: {
        [P in Exclude<keyof C, "r_type" | "r_attributes">]: C[P];
      };
    };

type MaybeMethods<M extends Record<string, any>> = keyof Omit<
  M,
  "r_type" | "r_attributes"
> extends never
  ? Record<string, never>
  : {
      methods: {
        [P in Exclude<keyof M, "r_type" | "r_attributes">]: M[P];
      };
    };

type WidgetState<P extends Record<string, any>> = Expand<{
  [K in Exclude<keyof P, "r_type" | "r_attributes">]:
    | Parameters<P[K]["set"]>[0];
}>;

export class WidgetStore<
  T extends Record<string, any>,
  C extends Record<string, any>,
  M extends Record<string, any> = Record<string, never>,
> {
  private widget: Widget<T, C, M> | undefined;
  private ctor: (
    f: (
      v: Partial<Expand<WidgetState<T>>>,
      k: (err: string | null, res: null) => void,
    ) => void,
  ) => Promise<Widget<T, C, M>>;
  private status: WidgetStatus = "loading";
  private fields: Widget<T, C, M>["properties"] | undefined;
  private children: Widget<T, C, M>["children"] | undefined;
  private methods: Widget<T, C, M>["methods"] | undefined;
  private state: WidgetState<T> | undefined;

  private timeoutRefs: Partial<
    Record<Exclude<keyof T, "r_type" | "r_attributes">, NodeJS.Timeout>
  >;
  private listeners = new Set<() => void>();

  private snapshot: {
    widget: Widget<T, C, M> | undefined;
    status: WidgetStatus;
    fields: Widget<T, C, M>["properties"] | undefined;
    children: Widget<T, C, M>["children"] | undefined;
    methods: Widget<T, C, M>["methods"] | undefined;
    state: WidgetState<T> | undefined;
  };

  constructor(
    ctor: (
      f: (
        v: Partial<Expand<WidgetState<T>>>,
        k: (err: string | null, res: null) => void,
      ) => void,
    ) => Promise<Widget<T, C, M>>,
  ) {
    this.ctor = ctor;
    this.timeoutRefs = {};
    this.snapshot = {
      widget: this.widget,
      status: this.status,
      fields: this.fields,
      children: this.children,
      methods: this.methods,
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
    this.fields = widget.properties as any;
    this.children = widget.children as any;
    this.methods = (widget as any).methods;
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
      children: this.children,
      methods: this.methods,
      fields: this.widget?.properties as any,
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
    delay: number = 0,
  ) => {
    if (this.timeoutRefs[prop as string]) {
      clearTimeout(this.timeoutRefs[prop as string]);
    }

    this.timeoutRefs[prop] = setTimeout(() => {
      if (this.fields) this.fields[prop].set(value);
    }, delay);
  };

  destroy() {
    if (this.timeoutRefs) {
      Object.keys(this.timeoutRefs).map((t) =>
        clearTimeout(this.timeoutRefs[t]),
      );
    }
  }
}

export function useWidget<
  P extends Record<string, any>,
  C extends Record<string, any> = Record<string, never>,
  M extends Record<string, any> = Record<string, never>,
>(
  ctor: (
    f:
      | ((
          v: Partial<Expand<WidgetState<P>>>,
          k: (err: string | null, res: null) => void,
        ) => void)
      | ((v: any, k: (...args: any[]) => void) => void),
  ) => Promise<{
    properties?: P;
    children?: C;
    methods?: M;
  }>,
) {
  const storeRef = useRef<WidgetStore<P, C, M>>(undefined);

  if (!storeRef.current) {
    storeRef.current = new WidgetStore(ctor as any);
  }

  const state = useSyncExternalStore(
    storeRef.current.subscribe,
    storeRef.current.getSnapshot,
    storeRef.current.getSnapshot,
  );

  useEffect(() => {
    return () => {
      storeRef.current?.destroy();
    };
  }, []);

  return { ...state, set: storeRef.current.set };
}

type SafeMethods<T> = T extends { methods: infer M extends Record<string, any> }
  ? M
  : Record<string, never>;

export type RWidget<T extends (fn: any) => any> = Expand<
  Widget<
    Awaited<ReturnType<T>>["properties"],
    Awaited<ReturnType<T>>["children"],
    SafeMethods<Awaited<ReturnType<T>>>
  >
>;

type WidgetStatus = "ready" | "loading" | "setting";
