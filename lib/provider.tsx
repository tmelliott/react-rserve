import { createContext, useContext, useEffect, useState } from "react";
// import RserveContext from "./context";
import RserveClient from "rserve-ts";
import { z } from "zod";

type RserveOptions = {
  host: string;
};

// TODO: this should be a generic type
export type RserveContextInterface<T> = {
  app?: T;
};

type AppType<T extends z.ZodRawShape> = z.infer<z.ZodObject<T, "strip">>;

export function createRserveProvider<TFuns extends z.ZodRawShape>(
  schema: TFuns,
  config?: RserveOptions
) {
  const RserveContext = createContext<
    RserveContextInterface<AppType<TFuns>> | undefined
  >(undefined);

  const useRserve = () => {
    const context = useContext(RserveContext);
    if (context === undefined) {
      throw new Error("useRserveContext must be used within a RserveProvider");
    }
    return context;
  };

  const RserveProvider = ({ children }: { children: React.ReactNode }) => {
    const [con, setCon] = useState<
      Awaited<ReturnType<typeof RserveClient.create>> | undefined
    >();
    const [app, setApp] = useState<AppType<TFuns> | undefined>(undefined);

    useEffect(() => {
      const connect = async () => {
        try {
          const con = await RserveClient.create(
            config || { host: "localhost" }
          );
          setCon(con);
        } catch (error) {
          console.error("Failed to connect to Rserve", error);
        }
      };
      connect();
    }, [config]);

    useEffect(() => {
      if (!con) return;
      const init = async () => {
        try {
          const res = await con.ocap(schema);
          // TODO: work out how to avoid using as
          setApp(res as AppType<TFuns>);
        } catch (error) {
          console.error("Failed to initialize Rserve", error);
        }
      };
      init();
    }, [con, schema]);

    return (
      <RserveContext.Provider value={{ app }}>
        {children}
      </RserveContext.Provider>
    );
  };

  return { RserveContext, RserveProvider, useRserve };
}
