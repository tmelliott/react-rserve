import { useOcap } from "../lib/hooks/useOcap";
import { ocap2 } from "./rserve";

function App() {
  const { result, loading, error } = useOcap(ocap2);
  console.log("Part 1: ", { result, loading });
  return (
    <>
      <h1>React + Rserve</h1>
      {loading ? (
        "Loading ..."
      ) : error !== undefined ? (
        "Uh oh ... " + error
      ) : (
        <P2 ocap={result.fun} />
      )}
    </>
  );
}

function P2({ ocap }: { ocap: () => Promise<string> }) {
  const { result, loading, error } = useOcap(ocap);
  console.log("Part 2: ", { result, loading });

  if (loading) return <p>Still loading ...</p>;
  if (error !== undefined) return <p>Uh oh ... {error}</p>;
  return <p>{result}</p>;
}

export default App;
