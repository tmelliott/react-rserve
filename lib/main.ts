import { z } from "zod";

export { useOcap, useRserve, useWidget } from "./hooks";
export type { RserveConnectionStatus } from "./hooks/useRserve";

export type AppType<T extends z.ZodRawShape> = z.infer<z.ZodObject<T, "strip">>;
