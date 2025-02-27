# React-Rserve Development Guide

## Build & Development Commands
- `pnpm run dev` - Start development server
- `pnpm run build` - Build library for distribution
- `pnpm run lint` - Run ESLint checks
- `pnpm run ci` - Run lint and build (CI workflow)
- `pnpm run preview` - Preview the build locally
- `pnpm run check-exports` - Validate type exports

## Code Style Guidelines
- **TypeScript**: Use strong typing, avoid `any` where possible
- **Formatting**: 2-space indentation, semicolons required
- **Imports**: React first, then external deps, then internal (relative paths)
- **Naming**: 
  - Files: camelCase.ts/tsx
  - Components: PascalCase
  - Hooks: prefixed with "use" (useOcap, useRserve)
  - Types/Interfaces: PascalCase
- **Error Handling**: Use loading/error/result pattern in hooks
- **Components**: Functional components with explicit return types
- **Context**: Use React Context API for state management
- **React Patterns**: Prefer hooks pattern (useState, useEffect, useCallback)