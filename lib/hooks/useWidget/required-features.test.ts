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
    if (store.getSnapshot().status === "ready") return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error("WidgetStore did not become ready");
}

describe("Required behavior regressions", () => {
  it("snapshot exposes children from connector", async () => {
    const ctor = async () => ({
      properties: { value: createProp("x") },
      children: { nested: { widgetId: "child-1" } },
    });

    const store = new WidgetStore(ctor as any);
    await waitUntilReady(store);
    expect(store.getSnapshot().children).toEqual({
      nested: { widgetId: "child-1" },
    });
  });
});
