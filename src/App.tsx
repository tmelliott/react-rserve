import { useRserve, type App } from "./utils/rserve";
import { useOcap } from "../lib/hooks/useOcap";
import { Suspense, useState } from "react";

function App() {
  const { app, isConnecting } = useRserve();

  const [input, setInput] = useState(["hello", "world"]);

  const [progress, setProgress] = useState(0);

  // // Always call the hook but pass undefined if app isn't available
  const rResult = useOcap(app?.fn_first, [input]);
  const rResult2 = useOcap(app?.fn_mean, [new Float64Array([1, 2, 3, 4, 5])]);
  const rResult3 = useOcap(app?.sample_num, [
    new Float64Array([1, 2, 3, 4, 5]),
    3,
  ]);

  const [r4enabled, setR4enabled] = useState(false);
  const _r4 = useOcap(
    app?.iterate,
    [
      (i, k: (_err: any, _result: number) => void) => {
        setProgress(i);
        k(null, i);
      },
    ],
    {
      enabled: r4enabled,
    }
  );

  if (isConnecting) {
    return (
      <div>
        <h1>React + Rserve</h1>
        <p>Connecting to Rserve...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div>
        <h1>React + Rserve</h1>
        <p>Could not connect to R service</p>
      </div>
    );
  }

  return (
    <div>
      <h1>React + Rserve</h1>
      <p>Connected to R service</p>

      <section>
        <h2>First Function Result</h2>
        <input
          type="text"
          value={input.join(" ")}
          onChange={(e) => setInput(e.target.value.split(" "))}
        />
        {rResult.result ? (
          <p>Result: {rResult.result}</p>
        ) : rResult.loading ? (
          <p>Loading...</p>
        ) : rResult.error ? (
          <p>Error: {rResult.error}</p>
        ) : (
          <p>Some issue</p>
        )}
      </section>

      <section>
        <h2>Mean Function Result</h2>
        {rResult2.loading ? (
          <p>Loading...</p>
        ) : rResult2.error ? (
          <p>Error: {rResult2.error}</p>
        ) : (
          <p>Result: {rResult2.result}</p>
        )}
      </section>

      <section>
        <h2>Sample Function Result</h2>
        {rResult3.loading ? (
          <p>Loading...</p>
        ) : rResult3.error ? (
          <p>Error: {rResult3.error}</p>
        ) : (
          <p>
            Result: [
            {rResult3.result !== undefined &&
              (typeof rResult3.result === "number"
                ? rResult3.result
                : rResult3.result.map((r) => r).join(", "))}
            ]
          </p>
        )}
      </section>

      <section>
        <h2>Iterative progress update</h2>
        <button onClick={() => setR4enabled(true)}>
          {_r4.loading ? " ... " : "Start"}
        </button>
        <p>Progress: {progress}/10</p>

        <p>
          Note that this locks the entire R process until it is complete. Try
          playing with First Function.
        </p>
      </section>

      <section>
        <h2>Error handling</h2>
        <BadComponent fn={app.bad_fn} />
      </section>
    </div>
  );
}

export default App;

const BadComponent = ({ fn }: { fn: App["bad_fn"] }) => {
  const { result, loading, error } = useOcap(fn, []);

  if (loading) return <>Loading ... ... ... </>;
  if (error)
    return (
      <>
        There was an error! <pre>{error}</pre>
      </>
    );

  return <>Loaded: {result}</>;
};
