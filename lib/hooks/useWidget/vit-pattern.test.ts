import { describe, expect, it } from "vitest";
import { WidgetStore } from "./index";

/**
 * Behavioural tests for the VIT-style flow: `useRserve(schema)` gives `app.vitWidget`,
 * then `useWidget(app.vitWidget)` drives the root widget. These tests avoid Rserve;
 * they pin assumptions about `WidgetStore` that explain UI stuck on "Loading …"
 * when components gate on `state` being truthy.
 */

type MockProp<T> = {
  get: () => Promise<T>;
  set: (x: T) => Promise<void>;
  register: (
    f: (v: T, k: (err: string | null, res: null) => void) => void,
    id: string
  ) => Promise<string>;
};

function createProp<T>(value: T): MockProp<T> {
  let current = value;
  return {
    get: async () => current,
    set: async (x: T) => {
      current = x;
    },
    register: async () => "id",
  };
}

async function waitUntilReady(store: WidgetStore<any>) {
  for (let i = 0; i < 25; i += 1) {
    if (store.getSnapshot().status === "ready") {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error("WidgetStore did not become ready");
}

describe("VIT-style composite widget (WidgetStore)", () => {
  it("leaves state undefined after ready when the ctor never invokes the push callback", async () => {
    const ctor = async () => ({
      properties: {
        dsInfo: createProp({ nrows: 0, ncols: 0 }),
      },
      children: {
        samplingVariation: { kind: "child-widget-ctor" as const },
      },
      methods: {
        load_dataset: async (_url: string) => {},
      },
      capabilities: {
        actions: {
          enabled: true,
          types: [] as string[],
          strict: "off" as const,
        },
      },
    });

    const store = new WidgetStore(ctor as any);
    await waitUntilReady(store);

    const snap = store.getSnapshot();
    expect(snap.status).toBe("ready");
    expect(snap.state).toBeUndefined();
    const children = snap.children as
      | { samplingVariation?: { kind: string } }
      | undefined;
    expect(children?.samplingVariation).toEqual({
      kind: "child-widget-ctor",
    });
    expect(typeof snap.methods?.load_dataset).toBe("function");
  });

  it("hydrates state when the ctor invokes the push callback before returning the widget", async () => {
    const ctor = async (
      f: (v: unknown, k: (err: string | null, res: null) => void) => void
    ) => {
      f(
        { dsInfo: { nrows: 150, ncols: 5 } },
        (_err: string | null, _res: null) => {}
      );
      return {
        properties: {
          dsInfo: createProp({ nrows: 0, ncols: 0 }),
        },
        children: {},
        methods: {
          load_dataset: async (_url: string) => {},
        },
      };
    };

    const store = new WidgetStore(ctor as any);
    await waitUntilReady(store);

    expect(store.getSnapshot().state?.dsInfo).toEqual({
      nrows: 150,
      ncols: 5,
    });
  });

  it("merges subsequent pushes the same way as incremental R updates", async () => {
    let push: (
      v: unknown,
      k: (err: string | null, res: null) => void
    ) => void = () => {};

    const ctor = async (
      f: (v: unknown, k: (err: string | null, res: null) => void) => void
    ) => {
      push = f;
      return {
        properties: {
          dsInfo: createProp({ nrows: 0, ncols: 0 }),
        },
      };
    };

    const store = new WidgetStore(ctor as any);
    await waitUntilReady(store);

    expect(store.getSnapshot().state).toBeUndefined();

    push({ dsInfo: { nrows: 10, ncols: 3 } }, () => {});
    expect(store.getSnapshot().state?.dsInfo).toEqual({ nrows: 10, ncols: 3 });

    push({ dsInfo: { nrows: 11, ncols: 3 } }, () => {});
    expect(store.getSnapshot().state?.dsInfo).toEqual({ nrows: 11, ncols: 3 });
  });
});
