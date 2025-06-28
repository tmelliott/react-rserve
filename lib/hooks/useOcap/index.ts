import { useEffect, useRef, useState } from "react";

type StateType<R> = {
  result: R | undefined;
  loading: boolean;
  error: string | undefined;
};

type Config<Result> = {
  enabled: boolean;
  initialData: Result | undefined;
  placeholderData: Result | StateFun<Result> | undefined;
};

// const defaultConfig = {
//   enabled: true,
//   initialData: undefined,
//   placeholderData: undefined,
// } satisfies Config<any>;

type StateFun<T> = (prev: T | undefined) => T;
const isStateFunction = <T = any>(f: unknown): f is StateFun<T> => {
  return typeof f === "function";
};

export function useOcap<R, Args extends any[] = []>(
  ocap: ((...args: Args) => Promise<R>) | undefined,
  args: Args,
  config?: Partial<Config<R>>
) {
  const ocapEnabled = config?.enabled ?? true;
  const ocapInitialData = config?.initialData;
  const ocapPlaceholder = config?.placeholderData;

  // Initialize state - default to not loading if no ocap provided
  const [state, setState] = useState<StateType<R>>({
    result: ocapInitialData,
    loading: false,
    error: undefined,
  });

  // Use refs to track mounted state and prevent race conditions
  const mountedRef = useRef(true);

  // Create a stable dependency array for args
  let argsDepKey: string;
  try {
    // This is a hack to create a stable dependency for the effect
    // without causing rerenders due to complex arguments
    argsDepKey = JSON.stringify(args);
  } catch (_e) {
    // If JSON.stringify fails (circular references, etc.), use a counter
    argsDepKey = String(Date.now());
  }

  const argsRef = useRef(args);
  argsRef.current = args;

  useEffect(() => {
    if (!ocapEnabled) return;

    // Component mounted
    mountedRef.current = true;

    let active = true;

    // If no ocap, don't try to execute
    if (!ocap) {
      setState({
        result: ocapInitialData,
        loading: false,
        error: undefined,
      });
      return;
    }

    // Set loading only if we have a function
    setState((prev) => ({
      // result: undefined,
      result: isStateFunction<R>(ocapPlaceholder)
        ? ocapPlaceholder(prev.result)
        : ocapPlaceholder,
      loading: true,
      error: undefined,
    }));

    // Execute the function
    const execute = async () => {
      try {
        const result = await ocap(...argsRef.current);

        // Only update state if this is the most recent request
        // and the component is still mounted
        if (active && mountedRef.current) {
          setState({
            result,
            loading: false,
            error: undefined,
          });
        }
      } catch (error) {
        // Only update state if this is the most recent request
        // and the component is still mounted
        if (active && mountedRef.current) {
          if (error instanceof Error) {
            setState({
              result: undefined,
              loading: false,
              error: error.message,
            });
          } else {
            setState({
              result: undefined,
              loading: false,
              error: "An unknown error occurred",
            });
          }
        }
      }
    };

    execute();

    // Cleanup function for unmount or dependency change
    return () => {
      active = false;
    };
  }, [ocap, argsDepKey, ocapEnabled, ocapPlaceholder, ocapInitialData]); // using stable deps

  // Clean up on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return state;
}
