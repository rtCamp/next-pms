/** Props passed to the `fallback` slot. */
export interface ErrorFallbackSlotProps {
  /** The error thrown by a descendant. */
  error: Error;
  /** Clears the error and renders the default slot again. */
  reset: () => void;
}
