/**
 * External dependencies.
 */
import { createContext, type RefObject } from "react";

export interface UnsavedChangesSource {
  hasUnsavedChanges: () => boolean;
  saveChanges: (onSaved?: () => void) => void;
  discardChanges: () => void;
}

export interface UnsavedChangesContextValue {
  sourceRef: RefObject<UnsavedChangesSource | null>;
  requestGuardedAction: (action: () => void) => void;
}

export const UnsavedChangesContext =
  createContext<UnsavedChangesContextValue | null>(null);
