import { describe, expect, it } from "vitest";
import { WidgetStore } from "./index";

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

describe("WidgetStore", () => {
  it("exposes normalized capabilities when provided", async () => {
    const ctor = async () => ({
      properties: { value: createProp("x") },
      capabilities: {
        actions: { enabled: true, types: ["SetValue"], strict: "warn" as const },
      },
    });

    const store = new WidgetStore(ctor as any);
    await waitUntilReady(store);

    const snapshot = store.getSnapshot();
    expect(snapshot.capabilities?.actions.enabled).toBe(true);
    expect(snapshot.capabilities?.actions.strict).toBe("warn");
  });

  it("set forwards to property without action-mode warnings", async () => {
    const ctor = async () => ({
      properties: { value: createProp("x") },
      capabilities: {
        actions: { enabled: true, types: ["SetValue"], strict: "warn" as const },
      },
    });

    const store = new WidgetStore(ctor as any);
    await waitUntilReady(store);
    store.set("value", "y");
    await new Promise((r) => setTimeout(r, 20));
    expect(await store.getSnapshot().fields?.value.get()).toBe("y");
  });

  it("normalizes generated-like capabilities shape", async () => {
    const ctor = async () => ({
      properties: { value: createProp("x") },
      capabilities: {
        actions: {
          enabled: "yes",
          types: ["SetValue", 123, null],
          strict: "something-unexpected",
        },
      },
    });

    const store = new WidgetStore(ctor as any);
    await waitUntilReady(store);
    const snapshot = store.getSnapshot();

    expect(snapshot.capabilities?.actions.enabled).toBe(false);
    expect(snapshot.capabilities?.actions.types).toEqual(["SetValue"]);
    expect(snapshot.capabilities?.actions.strict).toBe("off");
  });
});
