// Type-level test for useWidget (state from get(), methods, children).
// Run via: npx tsc --noEmit -p tsconfig.lib.json

import { useWidget } from "./index";

type MockProp<T> = {
  get: () => Promise<T>;
  set: (x: T) => Promise<void>;
  register: (
    f: (v: T, k: (err: string | null, res: null) => void) => void,
    id: string
  ) => Promise<string>;
};

type MockWidget = {
  properties: {
    value: MockProp<string>;
    count: MockProp<number>;
  };
  methods: {
    reset: () => Promise<void>;
  };
};

declare const widgetCtor: (
  f: (
    v: { value?: string; count?: number },
    k: (err: string | null, res: null) => void
  ) => void
) => Promise<MockWidget>;

export function TypeCoreSurface() {
  const { state, methods, children, set, fields } = useWidget(widgetCtor);

  if (state) {
    void (state.value satisfies string);
    void (state.count satisfies number);
  }

  if (methods) {
    void methods.reset;
  }

  void children;
  void set;
  void fields;
}

type GeneratedLikeWidgetCtor = (
  f: (
    v: Partial<{ name: string }>,
    k: (err: string | null, res: null) => void
  ) => void
) => Promise<{
  properties: {
    name: MockProp<string>;
  };
  children:
    | (unknown[] & { r_type: "vector"; r_attributes: Record<string, unknown> })
    | (Record<string, unknown> & {
        r_type: "vector";
        r_attributes: { names: string[] } & Record<string, unknown>;
      });
  capabilities: {
    actions: {
      enabled: boolean;
      types: string[];
      strict: string;
    };
  };
  methods: {
    ping: () => Promise<unknown>;
  };
}>;

declare const generatedLikeWidget: GeneratedLikeWidgetCtor;

export function TypeGeneratedCtorCompatibility() {
  const { capabilities, methods } = useWidget(generatedLikeWidget);

  if (capabilities) {
    void (capabilities.actions.strict satisfies "off" | "warn" | "strict");
  }

  if (methods) {
    void methods.ping;
  }
}

/** Mirrors rserve-ts `VectorObject`: named methods still carry `r_type: "vector"`. */
type VectorObjectMethods = {
  load_dataset: (url: string) => Promise<void>;
} & {
  readonly r_type: "vector";
  r_attributes: Record<string, unknown>;
};

type CtorVectorObjectMethods = () => Promise<{
  properties: {
    value: MockProp<string>;
  };
  methods: VectorObjectMethods;
}>;

declare const ctorVectorObjectMethods: CtorVectorObjectMethods;

export function TypeVectorObjectMethodsNotWidenedToRecord() {
  const { methods } = useWidget(ctorVectorObjectMethods);

  if (methods) {
    void (methods.load_dataset satisfies (url: string) => Promise<void>);
  }
}

/** Child-like widget type with no `methods` key (generated child connectors). */
type WidgetShapeNoMethodsKey = {
  properties: { value: MockProp<string> };
  children?: Record<string, never>;
};

declare const ctorNoMethodsKey: () => Promise<WidgetShapeNoMethodsKey>;

export function TypeOmittedMethodsFieldUsesWidgetMethods() {
  const { methods } = useWidget(ctorNoMethodsKey);
  if (methods) {
    void (methods satisfies Record<string, unknown>);
  }
}
