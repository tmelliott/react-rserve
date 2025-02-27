import { useRserve } from "./utils/rserve";
import { useOcap } from "../lib/hooks/useOcap";

function App() {
  const { app, isConnecting } = useRserve();

  // Always call the hook but pass undefined if app isn't available
  const rResult = useOcap(app?.fn_first, ["hello", "world"]);
  const rResult2 = useOcap(app?.fn_mean, new Float64Array([1, 2, 3, 4, 5]));
  const rResult3 = useOcap(
    app?.sample_num,
    new Float64Array([1, 2, 3, 4, 5]),
    3
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

      <div>
        <h2>First Function Result</h2>
        {rResult.loading ? (
          <p>Loading...</p>
        ) : rResult.error ? (
          <p>Error: {rResult.error}</p>
        ) : (
          <p>Result: {rResult.result}</p>
        )}
      </div>

      <div>
        <h2>Mean Function Result</h2>
        {rResult2.loading ? (
          <p>Loading...</p>
        ) : rResult2.error ? (
          <p>Error: {rResult2.error}</p>
        ) : (
          <p>Result: {rResult2.result}</p>
        )}
      </div>

      <div>
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
      </div>
    </div>
  );
}

export default App;
