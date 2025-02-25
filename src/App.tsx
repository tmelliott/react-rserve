import { useOcap } from "../lib/hooks/useOcap";
import { ocap2 } from "./rserve";

function App() {
  const { result, loading } = useOcap(ocap2);
  console.log("Part 1: ", { result, loading });
  return (
    <>
      <h1>React + Rserve</h1>
      {loading ? "Loading ..." : <P2 ocap={result.fun} />}
    </>
  );
}

function P2({ ocap }: { ocap: () => Promise<string> }) {
  const { result, loading } = useOcap(ocap);
  console.log("Part 2: ", { result, loading });
  return <p>{loading ? "Still loading ..." : result}</p>;
}

export default App;
