import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
    console.log("Render useRserve");
    const context = useContext(RserveContext);
    if (context === undefined) {
      throw new Error("useRserveContext must be used within a RserveProvider");
    }
    return context;
  };

  // const useRserve = () => {
  //   const [con, setCon] = useState<
  //     Awaited<ReturnType<typeof RserveClient.create>> | undefined
  //   >(undefined);
  //   const [app, setApp] = useState<AppType<TFuns> | undefined>(undefined);

  //   const connect = useCallback(async () => {
  //     try {
  //       const con = await RserveClient.create(config || { host: "localhost" });
  //       setCon(con);

  //       const res: AppType<TFuns> = (await con.ocap(schema)) as any;
  //       setApp(res);
  //     } catch (error) {
  //       console.error("Failed to connect to Rserve", error);
  //     }
  //   }, [config, schema]);

  //   useEffect(() => {
  //     connect();
  //     return () => {
  //       con?.close();
  //     };
  //   }, []);

  //   return { app };
  // };

  const RserveProvider = ({ children }: { children: React.ReactNode }) => {
    // const [con, setCon] = useState<
    //   Awaited<ReturnType<typeof RserveClient.create>> | undefined
    // >();
    console.group("RserveProvider");
    console.log("Render start");

    const [con, setCon] = useState<
      Awaited<ReturnType<typeof RserveClient.create>> | undefined
    >(undefined);
    const [app, setApp] = useState<AppType<TFuns> | undefined>(undefined);

    const connect = useCallback(async () => {
      console.log("Running connect: ", { config, schema });
      if (con) return;
      try {
        console.log("Creating RserveClient: ", config);
        const c = await RserveClient.create(config || { host: "localhost" });
        setCon(c);
      } catch (error) {
        console.error("Failed to connect to Rserve", error);
      }
      console.log("Connect complete");
    }, []);

    useEffect(() => {
      connect();
      return () => {
        console.log("Closing connection");
        con?.close();
        setCon(undefined);
      };
    }, [connect]);

    const start = useCallback(async () => {
      if (!con) return;
      console.log("Connecting to app", schema);
      const res: AppType<TFuns> = (await con.ocap(schema)) as any;
      console.log("Setting app");
      setApp(res);
      console.log("Start complete");
    }, [con]);

    useEffect(() => {
      start();
    }, [start]);

    console.log("Render complete: ", app);

    console.groupEnd();
    return (
      <RserveContext.Provider value={{ app }}>
        {children}
      </RserveContext.Provider>
    );
  };

  return { RserveContext, RserveProvider, useRserve };
  // return { useRserve };
}
