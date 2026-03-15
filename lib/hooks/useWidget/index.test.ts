import { describe, expect, it, vi } from "vitest";
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

describe("WidgetStore action capabilities", () => {
  it("exposes capabilities and derived actionState", async () => {
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
    expect(snapshot.actionState?.strict).toBe("warn");
    expect(snapshot.actionState?.canUndo).toBe(false);
    expect(snapshot.actionState?.actionCount).toBe(0);
  });

  it("warns on direct set in warn mode", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const ctor = async () => ({
      properties: { value: createProp("x") },
      capabilities: {
        actions: { enabled: true, types: ["SetValue"], strict: "warn" as const },
      },
    });

    const store = new WidgetStore(ctor as any);
    await waitUntilReady(store);
    store.set("value", "y");

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("does not warn on direct set in off mode", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ctor = async () => ({
      properties: { value: createProp("x") },
      capabilities: {
        actions: { enabled: true, types: ["SetValue"], strict: "off" as const },
      },
    });

    const store = new WidgetStore(ctor as any);
    await waitUntilReady(store);
    store.set("value", "y");

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("dispatchAction forwards to widget method when available", async () => {
    const dispatchSpy = vi.fn().mockResolvedValue(null);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ctor = async () => ({
      properties: { value: createProp("x") },
      methods: {
        dispatchAction: { call: dispatchSpy },
      },
    });

    const store = new WidgetStore(ctor as any);
    await waitUntilReady(store);
    await store.dispatchAction("SetValue", { value: "z" });

    expect(dispatchSpy).toHaveBeenCalledWith("SetValue", { value: "z" });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("warn mode warns but forwards unknown action types", async () => {
    const dispatchSpy = vi.fn().mockResolvedValue(null);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ctor = async () => ({
      properties: { value: createProp("x") },
      capabilities: {
        actions: { enabled: true, types: ["KnownAction"], strict: "warn" as const },
      },
      methods: {
        dispatchAction: { call: dispatchSpy },
      },
    });

    const store = new WidgetStore(ctor as any);
    await waitUntilReady(store);
    await store.dispatchAction("UnknownAction", { value: "z" });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("UnknownAction")
    );
    expect(dispatchSpy).toHaveBeenCalledWith("UnknownAction", { value: "z" });
    warnSpy.mockRestore();
  });

  it("strict mode throws for unknown action types", async () => {
    const dispatchSpy = vi.fn().mockResolvedValue(null);
    const ctor = async () => ({
      properties: { value: createProp("x") },
      capabilities: {
        actions: {
          enabled: true,
          types: ["KnownAction"],
          strict: "strict" as const,
        },
      },
      methods: {
        dispatchAction: { call: dispatchSpy },
      },
    });

    const store = new WidgetStore(ctor as any);
    await waitUntilReady(store);

    await expect(
      store.dispatchAction("UnknownAction", { value: "z" })
    ).rejects.toThrow(/UnknownAction/);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it("strict mode forwards known action types", async () => {
    const dispatchSpy = vi.fn().mockResolvedValue(null);
    const ctor = async () => ({
      properties: { value: createProp("x") },
      capabilities: {
        actions: {
          enabled: true,
          types: ["KnownAction"],
          strict: "strict" as const,
        },
      },
      methods: {
        dispatchAction: { call: dispatchSpy },
      },
    });

    const store = new WidgetStore(ctor as any);
    await waitUntilReady(store);
    await expect(
      store.dispatchAction("KnownAction", { value: "z" })
    ).resolves.toBeNull();

    expect(dispatchSpy).toHaveBeenCalledWith("KnownAction", { value: "z" });
  });

  it("off mode forwards unknown action types without warning", async () => {
    const dispatchSpy = vi.fn().mockResolvedValue(null);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ctor = async () => ({
      properties: { value: createProp("x") },
      capabilities: {
        actions: { enabled: true, types: ["KnownAction"], strict: "off" as const },
      },
      methods: {
        dispatchAction: { call: dispatchSpy },
      },
    });

    const store = new WidgetStore(ctor as any);
    await waitUntilReady(store);
    await store.dispatchAction("UnknownAction", { value: "z" });

    expect(warnSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith("UnknownAction", { value: "z" });
    warnSpy.mockRestore();
  });
});
