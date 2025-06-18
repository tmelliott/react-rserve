import { createRserveProvider } from "../../lib/provider";

// generated using the `ts` R package: github.com/tmelliott/ts
import appSchema from "../rserve/demo.rserve.ts";

export const { RserveContext, RserveProvider, useRserve } =
  createRserveProvider(appSchema, {
    host: import.meta.env.VITE_RSERVE_HOST ?? "http://127.0.0.1:6311",
  });
