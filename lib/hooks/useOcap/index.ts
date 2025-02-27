import { useEffect, useRef, useState } from "react";

type StateType<R> = {
  result: R | undefined;
  loading: boolean;
  error: string | undefined;
};

export function useOcap<R, Args extends any[] = []>(
  ocap: ((...args: Args) => Promise<R>) | undefined,
  ...args: Args
) {
  // Initialize state - default to not loading if no ocap provided
  const [state, setState] = useState<StateType<R>>({
    result: undefined,
    loading: false,
    error: undefined,
  });

  // Use refs to track mounted state and prevent race conditions
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  // Create a stable dependency array for args
  const argsDepKey = useRef("");
  try {
    // This is a hack to create a stable dependency for the effect
    // without causing rerenders due to complex arguments
    argsDepKey.current = JSON.stringify(args);
  } catch (e) {
    // If JSON.stringify fails (circular references, etc.), use a counter
    argsDepKey.current = String(Date.now());
  }

  useEffect(() => {
    // Component mounted
    mountedRef.current = true;

    // If no ocap, don't try to execute
    if (!ocap) {
      setState({
        result: undefined,
        loading: false,
        error: undefined,
      });
      return;
    }

    // Set loading only if we have a function
    setState({
      result: undefined,
      loading: true,
      error: undefined,
    });

    // Create a request ID to handle race conditions
    const currentRequestId = ++requestIdRef.current;

    // Execute the function
    const execute = async () => {
      try {
        const result = await ocap(...args);

        // Only update state if this is the most recent request
        // and the component is still mounted
        if (currentRequestId === requestIdRef.current && mountedRef.current) {
          setState({
            result,
            loading: false,
            error: undefined,
          });
        }
      } catch (error) {
        // Only update state if this is the most recent request
        // and the component is still mounted
        if (currentRequestId === requestIdRef.current && mountedRef.current) {
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
      if (currentRequestId === requestIdRef.current) {
        // This is the most recent request, mark that we no longer care about it
        requestIdRef.current++;
      }
    };
  }, [ocap, argsDepKey.current]); // using stable deps

  // Clean up on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return state;
}
