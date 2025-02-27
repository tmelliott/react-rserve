import { createRserveProvider } from "../../lib/provider.tsx";

// generated using the `ts` R package: github.com/tmelliott/ts
import appSchema from "../rserve/demo.rserve.ts";

export const { RserveContext, RserveProvider, useRserve } =
  createRserveProvider(appSchema, {
    host: "http://127.0.0.1:6311",
  });
