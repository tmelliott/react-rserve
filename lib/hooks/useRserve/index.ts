import { useEffect, useState } from "react";
import RserveClient from "rserve-ts";
import { z } from "zod";

type RserveOptions = Parameters<(typeof RserveClient)["create"]>[0];
type AppType<T extends z.ZodRawShape> = z.infer<z.ZodObject<T, "strip">>;

export type RserveApp<T> = {
  app?: T;
  isConnecting: boolean;
  error?: string;
};

const defaultConfig = {
  host: "http://localhost:6311",
};

export function useRserve<TFuns extends z.ZodRawShape>(
  schema: TFuns,
  config?: Partial<RserveOptions>
) {
  const [app, setApp] = useState<AppType<TFuns>>();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (app) return;
    if (connecting) return;
    setConnecting(true);
    RserveClient.create({ ...defaultConfig, ...config })
      .then((con) => {
        console.log("Connected: ", con, schema);
        return con.ocap(schema);
      })
      .then((res) => {
        console.log("Loaded: ", res);
        setApp(res as any as AppType<TFuns>);
        setConnecting(false);
      })
      .catch((e) => {
        setApp(undefined);
        setError(e);
        setConnecting(false);
      });

    return () => {
      console.log("Unmounting ");
      setApp(undefined);
    };
  }, [app, connecting, config, schema]);

  return {
    app,
    loading: connecting,
    error,
  };
}
