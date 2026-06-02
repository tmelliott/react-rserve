import { useEffect, useRef, useSyncExternalStore } from "react";
import type { z } from "zod";

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

type RawWidgetCapabilities = {
  actions?: {
    enabled?: unknown;
    types?: unknown;
    strict?: unknown;
  };
};

type WidgetMethodValue =
  | ((...args: any[]) => Promise<unknown>)
  | { call: (...args: any[]) => Promise<unknown> };
type WidgetMethods = Record<string, WidgetMethodValue | unknown>;

export type Widget<
  T extends Record<string, any>,
  M extends object = WidgetMethods,
  C = unknown,
> = {
  properties: {
    [K in Exclude<keyof T, "r_type" | "r_attributes">]: Expand<
      WidgetProperty<PropType<T[K]>, ResultType<T[K]>>
    >;
  };
  children?: C;
  methods?: M;
  capabilities?: WidgetCapabilities;
};

type WidgetCtorResult<
  T extends Record<string, any>,
  M extends object = WidgetMethods,
  C = unknown,
> = {
  properties: T;
  children?: C;
  methods?: M;
  capabilities?: RawWidgetCapabilities | WidgetCapabilities | unknown;
};

/**
 * Infer `properties` from the awaited widget. Do not use `infer P extends Record<string, any>`
 * on the same conditional: rserve-ts `Robj.list()` infers `properties` as an intersection
 * (`{ dsInfo: … } & { r_type; r_attributes }`) that often fails that constraint, so the
 * branch is skipped and `P` becomes `Record<string, never>` — collapsing `state` to
 * `{ [x: string]: never }` in the IDE.
 */
type InferWidgetProperties<R> = R extends {
  properties: infer P;
}
  ? P extends Record<string, any>
    ? P
    : P extends object
      ? P
      : Record<string, never>
  : Record<string, never>;

type InferWidgetChildren<R> = R extends { children?: infer C } ? C : unknown;

/**
 * ts_compile represents empty R `methods = list()` as a vector/array-shaped type,
 * not as `WidgetMethods`. Named method objects do *not* satisfy `M extends WidgetMethods`
 * (no string index signature), so we must not use that check to decide when to widen.
 *
 * Do not intersect with `WidgetMethods` here: that adds a string index signature and
 * degrades IntelliSense for concrete keys like `load_dataset`.
 *
 * rserve-ts `Robj.list({ ... })` is typed as `VectorObject`: every named list includes
 * `r_type: "vector"`, so we must not treat “has r_type vector” as empty. Empty compiled
 * lists are either (a) open `Record`/`string` keys plus metadata, or (b) metadata only.
 */
type RListMetadataKeys = "r_type" | "r_attributes";

/**
 * UI-facing shapes: strip rserve-ts list/vector `r_type` / `r_attributes` at every
 * object level (state from `get()`, methods bag, nested values, arrays).
 */
type StripRMetadata<T> = [T] extends [never]
  ? never
  : T extends string | number | boolean | bigint | symbol | null | undefined
    ? T
    : T extends (...args: any) => any
      ? T
      : T extends Date | RegExp | File | Blob
        ? T
        : T extends ReadonlyArray<infer U>
          ? ReadonlyArray<StripRMetadata<U>>
          : T extends Array<infer U>
            ? Array<StripRMetadata<U>>
            : T extends object
              ? Expand<{
                  [K in keyof Omit<T, RListMetadataKeys>]: StripRMetadata<
                    Omit<T, RListMetadataKeys>[K]
                  >;
                }>
              : T;

type IsCompiledEmptyRListMethods<M> = [M] extends [never]
  ? true
  : unknown extends M
    ? true
    : M extends ReadonlyArray<unknown>
      ? true
      : M extends { readonly r_type: "vector" }
        ? Exclude<keyof M, RListMetadataKeys> extends never
          ? true
          : string extends keyof M
            ? true
            : false
        : false;

/** When `R` has no `methods` field, `infer M` is `undefined`; default to `WidgetMethods`. */
type InferWidgetMethods<R> = R extends { methods?: infer M }
  ? [M] extends [undefined]
    ? WidgetMethods
    : IsCompiledEmptyRListMethods<M> extends true
      ? WidgetMethods
      : M
  : WidgetMethods;

/** Current widget values as returned by each property `get()` (matches UI + R pushes). */
type WidgetState<P extends Record<string, any>> = Expand<{
  [K in Exclude<keyof P, RListMetadataKeys>]: StripRMetadata<
    Awaited<ReturnType<P[K]["get"]>>
  >;
}>;

type UseWidgetSnapshot<
  P extends Record<string, any>,
  M extends object = WidgetMethods,
  C = unknown,
> = {
  widget: Widget<P, StripRMetadata<M>, C> | undefined;
  status: WidgetStatus;
  fields: Widget<P, M, C>["properties"] | undefined;
  children: Widget<P, M, C>["children"] | undefined;
  methods: StripRMetadata<M> | undefined;
  capabilities: WidgetCapabilities | undefined;
  state: WidgetState<P> | undefined;
};

export type UseWidgetReturn<
  P extends Record<string, any>,
  M extends object = WidgetMethods,
  C = unknown,
> = UseWidgetSnapshot<P, M, C> & {
  set: <K extends Exclude<keyof P, "r_type" | "r_attributes">>(
    prop: K,
    value: ResultType<P[K]>,
    delay?: number
  ) => void;
};

function normalizeCapabilities(raw: unknown): WidgetCapabilities | undefined {
  if (typeof raw !== "object" || raw === null) {
    return undefined;
  }
  const actions = (raw as RawWidgetCapabilities).actions;
  if (typeof actions !== "object" || actions === null) {
    return undefined;
  }

  const strictRaw = String(actions.strict ?? "off");
  const strict: ActionStrictness =
    strictRaw === "warn" || strictRaw === "strict" ? strictRaw : "off";
  const types = Array.isArray(actions.types)
    ? actions.types.filter((x): x is string => typeof x === "string")
    : [];

  return {
    actions: {
      enabled: typeof actions.enabled === "boolean" ? actions.enabled : false,
      types,
      strict,
    },
  };
}

export class WidgetStore<
  T extends Record<string, any>,
  M extends object = WidgetMethods,
  C = unknown,
> {
  private widget: Widget<T, StripRMetadata<M>, C> | undefined;
  /** Runtime always passes a setState callback; ctor is typed loosely to accept generated ocap wrappers. */
  private ctor: (f: unknown) => Promise<WidgetCtorResult<T, M, C>>;
  private status: WidgetStatus = "loading";
  private fields: Widget<T, M, C>["properties"] | undefined;
  private methods: M | undefined;
  private capabilities: WidgetCapabilities | undefined;
  private state: WidgetState<T> | undefined;

  private timeoutRefs: Partial<
    Record<Exclude<keyof T, "r_type" | "r_attributes">, ReturnType<typeof setTimeout>>
  >;
  private listeners = new Set<() => void>();

  private snapshot: {
    widget: Widget<T, StripRMetadata<M>, C> | undefined;
    status: WidgetStatus;
    fields: Widget<T, M, C>["properties"] | undefined;
    children: Widget<T, M, C>["children"] | undefined;
    methods: StripRMetadata<M> | undefined;
    capabilities: WidgetCapabilities | undefined;
    state: WidgetState<T> | undefined;
  };

  constructor(ctor: (f: unknown) => Promise<WidgetCtorResult<T, M, C>>) {
    this.ctor = ctor;
    this.timeoutRefs = {};
    this.snapshot = {
      widget: this.widget,
      status: this.status,
      fields: this.fields,
      children: undefined,
      methods: this.methods as StripRMetadata<M> | undefined,
      capabilities: this.capabilities,
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
    const widget = await this.ctor(
      (v: unknown, k: (err: string | null, res: null) => void) => {
        this.updateState(v as Partial<WidgetState<T>>);
        k(null, null);
      }
    );
    const capabilities = normalizeCapabilities(widget.capabilities);
    this.widget = {
      ...widget,
      capabilities,
    } as Widget<T, StripRMetadata<M>, C>;
    this.fields = widget.properties;
    this.methods = widget.methods;
    this.capabilities = capabilities;
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
      children: this.widget?.children,
      methods: this.methods as StripRMetadata<M> | undefined,
      capabilities: this.capabilities,
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
        clearTimeout(this.timeoutRefs[t])
      );
    }
  }
}

/**
 * Plain JS ctor, or rserve-ts `Robj.ocap(...)` which is typed as `z.ZodEffects<…>`
 * whose `z.infer` is the actual callable `(push?, …) => Promise<widget>`.
 */
type WidgetCtorFn = (...args: any[]) => Promise<any>;

export type WidgetCtorLike = WidgetCtorFn | z.ZodTypeAny;

type ResolveWidgetCtor<T extends WidgetCtorLike> = T extends WidgetCtorFn
  ? T
  : T extends z.ZodTypeAny
    ? z.infer<T> extends WidgetCtorFn
      ? z.infer<T>
      : never
    : never;

type WidgetResultFromCtor<T extends WidgetCtorLike> = Awaited<
  ReturnType<Extract<ResolveWidgetCtor<T>, WidgetCtorFn>>
>;

/**
 * Widget shape is taken from `Awaited<ReturnType<resolvedCtor>>` so inference works for
 * push-callback ctors, zero-arity factories, and Zod-wrapped ocap exports.
 */
export function useWidget<
  TCtor extends WidgetCtorLike &
    ([ResolveWidgetCtor<TCtor>] extends [never] ? never : unknown),
>(
  ctor: TCtor
): UseWidgetReturn<
  InferWidgetProperties<WidgetResultFromCtor<TCtor>>,
  InferWidgetMethods<WidgetResultFromCtor<TCtor>>,
  InferWidgetChildren<WidgetResultFromCtor<TCtor>>
> {
  type R = WidgetResultFromCtor<TCtor>;
  type P = InferWidgetProperties<R>;
  type M = InferWidgetMethods<R>;
  type C = InferWidgetChildren<R>;

  const storeRef = useRef<WidgetStore<P, M, C>>(undefined);

  if (!storeRef.current) {
    storeRef.current = new WidgetStore(
      ctor as unknown as (f: unknown) => Promise<WidgetCtorResult<P, M, C>>
    );
  }

  // `storeRef.current` is not control-flow narrowed for method references; bind a local
  // so `useSyncExternalStore` infers `Snapshot` from `WidgetStore<P, M, C>["getSnapshot"]`.
  const store = storeRef.current;

  const snap = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot
  );

  useEffect(() => {
    return () => {
      store.destroy();
    };
  }, [store]);

  return {
    ...snap,
    set: store.set,
  };
}

export type RWidget<T extends WidgetCtorLike> = Expand<
  Widget<InferWidgetProperties<WidgetResultFromCtor<T>>>
>;

type WidgetStatus = "ready" | "loading" | "setting";
