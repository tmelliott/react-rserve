import React from "react";

export function useOcap<T>(ocap?: () => Promise<T>) {
  const [result, setResult] = React.useState<T | undefined>(undefined);

  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<Error | undefined>(undefined);

  React.useEffect(() => {
    if (!ocap) return;
    const executeOcap = async () => {
      try {
        const res = await ocap();
        setResult(res);
        setLoading(false);
      } catch (error) {
        if (error instanceof Error) {
          setError(error);
        } else {
          setError(new Error("An unknown error occurred"));
        }
      }
    };
    executeOcap();
  }, [ocap]);

  return {
    result,
    loading: loading,
    error: error?.message,
  } as
    | {
        result: undefined;
        loading: true;
        error: string | undefined;
      }
    | {
        result: T;
        loading: false;
        error: undefined;
      };
}
