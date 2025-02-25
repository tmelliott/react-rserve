**react-rserve**

A React library that provides utilities for connecting to and using Rserve.

## TODO:

- set up ci
- set up changesets

## Example usage

1. Create Rserve hooks:

```tsx
// utils/rserve.ts
import { createRserveHooks } from "react-rserve";

// generated using the `ts` R package: github.com/tmelliott/ts
import app from "../path/to/app.ts";

export const rserve = createRserveHooks(app);
```

2. Set up the provider:

```tsx
// App.tsx
import { RserveClient } from "react-rserve";
import DemoComponent from "./DemoComponent";

export default function App() {
  return (
    <RserveClient host="localhost:6311">
      <div>
        <h1>React Rserve</h1>
        <DemoComponent />
      </div>
    </RserveClient>
  );
}
```

3. Use the app in components:

```tsx
// DemoComponent.tsx
import { rserve } from "./utils/rserve";

export default function DemoComponent() {
  const { app } = useRserve();
  const { result, loading, error } = useOcap(app.fun);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return <p>{result}</p>; // "Hello, world!"
}
```

If an Ocap returns more Ocaps, you need to use conditional components.

```tsx
import type { App } from "../path/to/app.ts";

// AnotherComponent.tsx
function AnotherComponent() {
  const { app } = useRserve();
  const { result, loading } = useOcap(app.anotherFun);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return <SubComponent ocap={result.secondaryFunction} />;
}

type AnotherFunResult = Awaited<ReturnType<App.anotherFun>>;

function SubComponent({
  ocap,
}: {
  ocap: AnotherFunResult["secondaryFunction"];
}) {
  const { result, loading, error } = useOcap(ocap);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return <p>{result}</p>;
}
```
