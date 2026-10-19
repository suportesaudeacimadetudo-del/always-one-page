// The static distribution has no TanStack server or compiler. Keep the client-only
// boundary without importing server request context into the browser bundle.
export function createClientOnlyFn<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
) {
  return (...args: TArgs): TResult => {
    if (typeof window === "undefined") throw new Error("Recurso disponível no navegador.");
    return fn(...args);
  };
}
