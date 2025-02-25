import { useEffect } from "react";
// import { useOcap } from "../lib/hooks/useOcap";
import { useRserve } from "./utils/rserve";

function App() {
  const { app } = useRserve();

  useEffect(() => {
    async function run() {
      if (!app) return;
      console.log(await app.fn_first(["hello", "world"]));
    }
    run();
  }, [app]);

  return (
    <>
      <h1>React + Rserve</h1>
      {/* {loading ? (
        "Loading ..."
      ) : error !== undefined ? (
        "Uh oh ... " + error
      ) : (
        <P2 ocap={result.fun} />
      )} */}
    </>
  );
}

// function P2({ ocap }: { ocap: () => Promise<string> }) {
//   const { result, loading, error } = useOcap(ocap);
//   console.log("Part 2: ", { result, loading });

//   if (loading) return <p>Still loading ...</p>;
//   if (error !== undefined) return <p>Uh oh ... {error}</p>;
//   return <p>{result}</p>;
// }

export default App;
