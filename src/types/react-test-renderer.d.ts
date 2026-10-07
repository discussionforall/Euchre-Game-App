// Minimal types for the parts of react-test-renderer our tests use.
// (The package ships with jest-expo but without TypeScript types.)

declare module 'react-test-renderer' {
  import type { ReactElement } from 'react';

  export function act(callback: () => void): void;
  export function create(element: ReactElement): { unmount(): void };
}
