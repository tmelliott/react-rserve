// import { useOcap } from "../lib/hooks/useOcap";
// import { useRserve } from "./utils/rserve";

function App() {
  // const { app } = useRserve();
  // console.log(app);

  // const res_first = useOcap(app?.fn_first, ["hello", "world"]);
  // console.log(res_first);

  // const res_mean = useOcap(app?.fn_mean, new Float64Array([1, 2, 3, 4, 5]));
  // console.log(res_mean);

  console.log("ping");
  // const res_sample = useOcap(
  //   app?.sample_num,
  //   new Float64Array([1, 2, 3, 4, 5, 6]),
  //   4
  // );
  // console.log(res_sample);

  return (
    <div>
      <h1>React + Rserve</h1>

      {/* <h2>First function</h2>
      {res_first.loading ? (
        "Loading ..."
      ) : res_first.error !== undefined ? (
        "Uh oh ... " + res_first.error
      ) : (
        <p>Response: {res_first.result}</p>
      )}

      <h2>Mean function</h2>
      {res_mean.loading ? (
        "Loading ..."
      ) : res_mean.error !== undefined ? (
        "Uh oh ... " + res_mean.error
      ) : (
        <p>Response: {res_mean.result}</p>
      )} */}
    </div>
  );
}

export default App;
