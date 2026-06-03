/**
 * External dependencies.
 */
import { useContext } from "react";

/**
 * Internal dependencies.
 */
import {
  UnsavedChangesContext,
  type UnsavedChangesContextValue,
} from "./context";

function useUnsavedChangesContext(): UnsavedChangesContextValue {
  const ctx = useContext(UnsavedChangesContext);
  if (!ctx) {
    throw new Error(
      "useUnsavedChangesContext must be used inside <UnsavedChangesProvider>",
    );
  }
  return ctx;
}

export function useUnsavedChangesSource() {
  return useUnsavedChangesContext().sourceRef;
}

export function useGuardedAction() {
  return useUnsavedChangesContext().requestGuardedAction;
}
