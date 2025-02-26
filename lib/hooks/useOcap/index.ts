import React, { useCallback, useMemo } from "react";

type StateType<R> =
  | {
      result: undefined;
      loading: true;
      error: undefined;
    }
  | {
      result: undefined;
      loading: false;
      error: string;
    }
  | {
      result: R;
      loading: false;
      error: undefined;
    };

export function useOcap<R, Args extends any[] = []>(
  ocap: ((...args: Args) => Promise<R>) | undefined,
  ...args: Args
) {
  console.log("useOcap");

  const [state, setState] = React.useState<StateType<R>>({
    result: undefined,
    loading: true,
    error: undefined,
  });

  const arrayArg = useMemo(() => args, [args]);

  const executeOcap = useCallback(async () => {
    if (!ocap) return;
    setState({ result: undefined, loading: true, error: undefined });
    try {
      const res = await ocap(...arrayArg);
      setState({ result: res, loading: false, error: undefined });
    } catch (error) {
      if (error instanceof Error) {
        setState({ result: undefined, loading: false, error: error.message });
      } else {
        setState({
          result: undefined,
          loading: false,
          error: "An unknown error occurred",
        });
      }
    }
  }, [ocap, arrayArg]);

  React.useEffect(() => {
    executeOcap();
  }, [executeOcap]);

  return state;
}
