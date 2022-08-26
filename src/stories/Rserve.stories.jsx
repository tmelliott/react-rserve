import { memo, useMemo, useState } from 'react';

import { Rserve, useRserve } from '../components/Rserve';
import { getMethods, useMethods } from "../components/useMethods";
import { createPromise as cP } from "../components/createPromise"
import { useRef } from 'react';

const createPromise = (...args) => {
  console.log('creating promise ...')
  return cP(...args)
}

const MyApp = () => {
  const { R, connecting } = useRserve();
  const [v, setV] = useState(null);

  const ocap = R ? R.ocap : null
  const { methods, loading, error } = useMethods(ocap)

  const onClick = () => {
    methods.heartbeat((e, v) => { console.log(v) })
  }

  // Handle connection state
  if (connecting) return <>Connecting ...</>
  if (!R) return <>Could not connect to R.</>

  // Handle loading methods state
  if (loading) return <>Loading ...</>
  if (error) return <>Error: {error}</>

  const rversion = createPromise(methods.rversion)
  rversion().then(v => {
    console.log('setting v')
    setV(v)
  })

  if (!v) return <>Fetching version ...</>

  return <>
    <p>Demo app with R version {v} running</p>
    <button onClick={onClick}>Do something</button>
  </>;
};

export default {
  title: 'Rserve',
  component: Rserve
}

const Template = (args) => <Rserve {...args}><MyApp /></Rserve>
export const Local = Template.bind({})
Local.args = { host: 'ws://localhost:8081' }


const ClusterDemo = ({ R }) => {
  const [n, setN] = useState(2)
  const plotRef = useRef(null)

  if (!R) return;

  const plotFn = createPromise(R.cluster_plot);
  plotFn(n)
    .then(x => {
      if (!plotRef.current) return;
      plotRef.current.src = x
    })
    .catch(e => {
      console.log("Error: e")
    })

  return <div>
    <div>
      <input type="number" min={2} max={8} value={n}
        onChange={(e) => setN(e.target.value)} />
    </div>

    <div>
      <img ref={plotRef} src={""} />
    </div>
  </div>
}

const ClusterDemoMemo = memo(ClusterDemo);

const ClusterApp = () => {
  const { R, connecting } = useRserve();
  const { methods, loading, error } = useMethods(R ? R.ocap : null);
  const [module, setModule] = useState(null)

  const [test, setTest] = useState(false);

  const onClick = () => setTest(cur => !cur)

  useMemo(() => {
    if (!methods) return;
    const Rfun = createPromise(methods.use_module)
    Rfun("clustering")
      .then(funs => setModule(funs))
      .catch(e => console.error(e))
  }, [methods])

  if (connecting) return <>Connecting ...</>
  if (!R) return <>Could not connect to R.</>

  if (loading) return <>Loading ...</>
  if (error) return <>Error: {error}</>

  return <>
    <h1>Clustering demo</h1>

    <button onClick={onClick}>Toggle test</button>

    <ClusterDemoMemo R={module} />
  </>
}

const ClusterTemplate = (args) => <Rserve {...args}><ClusterApp /></Rserve>
export const ClusteringDemo = ClusterTemplate.bind({})
ClusteringDemo.args = { host: 'ws://localhost:8081' }
