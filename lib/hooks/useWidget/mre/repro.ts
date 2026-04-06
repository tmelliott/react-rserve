import { useWidget } from "../index";

type GeneratedLikeWidgetCtor = (
  f: (
    v: Partial<{ name: string }>,
    k: (err: string | null, res: null) => void
  ) => void
) => Promise<{
  properties: {
    name: {
      get: () => Promise<string>;
      set: (x: string) => Promise<void>;
      register: (
        cb: (v: string, k: (err: string | null, res: null) => void) => void,
        id: string
      ) => Promise<string>;
    };
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

declare const generatedWidget: GeneratedLikeWidgetCtor;

export function GeneratedCtorRepro() {
  const { capabilities, dispatchAction } = useWidget(generatedWidget);

  if (capabilities) {
    void (capabilities.actions.strict satisfies "off" | "warn" | "strict");
  }
  void dispatchAction({ type: "SetName", payload: { name: "x" } });
  return null;
}

void GeneratedCtorRepro;
