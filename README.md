# react-rserve

> An Rserve interface for react

[![npm version](https://badge.fury.io/js/@tmelliott%2Freact-rserve.svg)](https://badge.fury.io/js/@tmelliott%2Freact-rserve)

## Install

```bash
npm install --save @tmelliott/react-rserve
```

## Usage

In the outer-most component, use the `Rserve` wrapper. This will typically be in `index.jsx`, for example:

```tsx
// index.jsx
import React from "react";
import ReactDOM from "react-dom";
import { Rserve } from "@tmelliott/react-rserve";
import App from "./App";

ReactDOM.render(
  <Rserve host={"ws://localhost:8081"}>
    <App />
  </Rserve>,
  document.getElementById("root")
);
```

Then use the `useRserve()` hook in any components that need to use R:

```tsx
// App.jsx
import React from "react";
import { useRserve } from "@tmelliott/react-rserve";

const App = () => {
  // connecting is `true` if a connection attempt is underway, otherwise it is `false`
  const { R, connecting } = useRserve();
  const [fns, setFns] = React.useState([]);

  if (R.running) {
    R.ocap((err, funs) => setFns(funs));
  }

  return <div>{connecting ? "Connecting to R ..." : "..."}</div>;
};

export default App;
```

## Running with Rserve

The example app contains a `demo` folder with a demo Rserve app. Inside this is a `server` folder containing scripts to launch an Rserve instance. This can be started with

```bash
npm run server
```

You'll need to run your own Rserve instance and connect to it by passing a valid `host` URL to the `Rserve` component when you build your own app.

## License

MIT © [tmelliott](https://github.com/tmelliott)
