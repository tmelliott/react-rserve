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
  const { result, loading, error } = rserve.useOcap("hello", "world");

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error.message}</p>;
  }

  return <p>{result}</p>; // "Hello, world!"
}
```

## Other examples

Any ocaps that return new ocaps will return new hooks:

```tsx
function MultipleHooks() {
  const { result: intro, loading: loadingIntro } = rserve.useOcap(
    "intro",
    "world",
  );

  // I don't know if this will work, lol
  const { result: message, loading: loadingMessage } = intro.useOcap("print");

  return (
    <div>
      <p>{message ?? "Loading ..."}</p>
    </div>
  );
}
```
