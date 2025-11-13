# @tmelliott/react-rserve

## 0.8.0

### Minor Changes

- 9ae2d7f: Enhanced `useWidget` hook with support for child widgets. The hook now properly handles widgets that contain other widgets as children, enabling hierarchical widget structures. The return type now includes a `children` property when child widgets are present.

## 0.7.0

### Minor Changes

- da82406: Add useWidget hook

## 0.6.1

### Patch Changes

- 0f36826: Reconnect when websocket disconnects

## 0.6.0

### Minor Changes

- e944cb4: Use state store for useRserve hook, instead of useState/useEffect

## 0.5.0

### Minor Changes

- 3514304: BREAKING CHANGE: replace context provider (`<Rserve></Rserve>`) with a hook `useRserve({...})`

## 0.4.0

### Minor Changes

- 3c430af: Add error handling into useOcap

## 0.3.0

### Minor Changes

- 2780462: BREAKING CHANGE: useOcap takes array as second argument; and optional config argument

### Patch Changes

- 2780462: Add in config options to useOcap: enabled, initialData, placeholderData

## 0.2.5

### Patch Changes

- update dependency versions

## 0.2.4

### Patch Changes

- d3f3780: Fix type exports

## 0.2.3

### Patch Changes

- 8ce8fc8: Fit export of createRserveProvider

## 0.2.2

### Patch Changes

- 203186c: Fix CI

## 0.2.1

### Patch Changes

- 71165e7: Remove debugging code
- 5200583: Add git URL, remove scripts'

## 0.2.0

### Minor Changes

- Added changesets for better release management.
- Refactor to use Typescript, and Vite to build/compile.
