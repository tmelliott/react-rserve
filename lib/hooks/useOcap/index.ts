import React from "react";

export function useOcap<R, Args extends any[] = []>(
  ocap: ((...args: Args) => Promise<R>) | undefined,
  ...args: Args
) {
  const [result, setResult] = React.useState<R | undefined>(undefined);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<Error | undefined>(undefined);

  // useEffect should only run when ocap or args change
  React.useEffect(() => {
    if (!ocap) return;
    const executeOcap = async () => {
      try {
        const res = await ocap(...args);
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
  }, [ocap, args]);

  // message when ocap changes
  React.useEffect(() => {
    console.log("OCAP CHANGES");
  }, [ocap]);

  // message when args change
  React.useEffect(() => {
    console.log("ARGS CHANGES");
  }, [args]);

  return {
    result,
    loading: loading,
    error: error?.message,
  } as
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
}
