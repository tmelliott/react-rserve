// Type-level test for useWidget action-enabled surface.
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
  };
  capabilities: {
    actions: {
      enabled: true;
      types: string[];
      strict: "warn";
    };
  };
  methods: {
    dispatchAction: {
      call: (
        action:
          | { type: "SetValue"; payload: { value: string } }
          | { type: "ResetValue"; payload: { hard: boolean } }
      ) => Promise<unknown>;
    };
    undo: { call: () => Promise<unknown> };
    redo: { call: () => Promise<unknown> };
  };
};

declare const widgetCtor: (
  f: (
    v: { value?: string },
    k: (err: string | null, res: null) => void
  ) => void
) => Promise<MockWidget>;

type MockWidgetTypePayload = {
  properties: {
    value: MockProp<string>;
  };
  methods: {
    dispatchAction: (type: string, payload: { value: string }) => Promise<unknown>;
  };
};

declare const widgetCtorTypePayload: (
  f: (
    v: { value?: string },
    k: (err: string | null, res: null) => void
  ) => void
) => Promise<MockWidgetTypePayload>;

export function TypeSurfaceChecks() {
  const {
    actionState,
    capabilities,
    dispatchAction,
    fields,
    redo,
    set,
    undo,
  } = useWidget(widgetCtor);

  if (fields) {
    void fields.value;
  }

  if (capabilities?.actions) {
    void (capabilities.actions.enabled satisfies boolean);
    void (capabilities.actions.types satisfies string[]);
    void (capabilities.actions.strict satisfies "off" | "warn" | "strict");
  }

  if (actionState) {
    void (actionState.canUndo satisfies boolean);
    void (actionState.canRedo satisfies boolean);
    void (actionState.actionCount satisfies number);
  }

  void dispatchAction;
  void undo;
  void redo;
  void set;

  void dispatchAction({ type: "SetValue", payload: { value: "x" } });
  void dispatchAction({ type: "ResetValue", payload: { hard: true } });
  void dispatchAction("SetValue", { value: "x" });
}

export function TypeSurfaceChecksTypePayload() {
  const { dispatchAction } = useWidget(widgetCtorTypePayload);

  void dispatchAction("SetValue", { value: "x" });
  void dispatchAction({ type: "SetValue", payload: { value: "x" } });
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
    dispatchAction: (
      action: { type: "SetName"; payload: { name: string } }
    ) => Promise<unknown>;
  };
}>;

declare const generatedLikeWidget: GeneratedLikeWidgetCtor;

export function TypeGeneratedCtorCompatibility() {
  const { capabilities, dispatchAction } = useWidget(generatedLikeWidget);

  if (capabilities) {
    void (capabilities.actions.strict satisfies "off" | "warn" | "strict");
  }

  void dispatchAction({ type: "SetName", payload: { name: "example" } });
}
