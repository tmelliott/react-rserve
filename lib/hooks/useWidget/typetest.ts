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
    dispatchAction: { call: (type: string, payload: unknown) => Promise<unknown> };
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
}
