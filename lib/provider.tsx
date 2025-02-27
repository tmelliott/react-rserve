import { createContext, useContext, useEffect, useRef, useState } from "react";
import RserveClient from "rserve-ts";
import { z } from "zod";

type RserveOptions = {
  host: string;
};

export type RserveContextInterface<T> = {
  app?: T;
  isConnecting: boolean;
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
    const [app, setApp] = useState<AppType<TFuns> | undefined>(undefined);
    const [isConnecting, setIsConnecting] = useState(false);
    const connectionRef = useRef<Awaited<
      ReturnType<typeof RserveClient.create>
    > | null>(null);
    const hasInitialized = useRef(false);

    // Single effect to handle both connection and initialization
    useEffect(() => {
      // Prevent duplicate initialization in StrictMode
      if (hasInitialized.current) return;

      const initConnection = async () => {
        if (isConnecting) return;
        setIsConnecting(true);

        try {
          // Create connection
          const con = await RserveClient.create(
            config || { host: "localhost" }
          );
          connectionRef.current = con;

          // Get app instance
          const res: AppType<TFuns> = (await con.ocap(schema)) as any;
          setApp(res);
        } catch (error) {
          console.error("Failed to connect to Rserve", error);
        } finally {
          setIsConnecting(false);
          hasInitialized.current = true;
        }
      };

      initConnection();

      // Cleanup function
      return () => {
        if (connectionRef.current) {
          connectionRef.current.close();
          connectionRef.current = null;
        }
      };
    }, [isConnecting]);

    return (
      <RserveContext.Provider value={{ app, isConnecting }}>
        {children}
      </RserveContext.Provider>
    );
  };

  return { RserveContext, RserveProvider, useRserve };
}
