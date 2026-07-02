/**
 * External dependencies.
 */
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { useBeforeUnload, useBlocker } from "react-router-dom";

/**
 * Internal dependencies.
 */
import { UnsavedChangesDialog } from "@/pages/allocations/components/unsavedChangesDialog";
import {
  UnsavedChangesContext,
  type UnsavedChangesContextValue,
  type UnsavedChangesSource,
} from "./context";

export type { UnsavedChangesSource };

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const sourceRef = useRef<UnsavedChangesSource | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const hasDirty = useCallback(
    () => sourceRef.current?.hasUnsavedChanges() ?? false,
    [],
  );

  const blocker = useBlocker(useCallback(() => hasDirty(), [hasDirty]));

  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (!hasDirty()) return;
        event.preventDefault();
        event.returnValue = "";
      },
      [hasDirty],
    ),
  );

  const requestGuardedAction = useCallback(
    (action: () => void) => {
      if (!hasDirty()) {
        action();
        return;
      }
      setPendingAction(() => action);
    },
    [hasDirty],
  );

  // Stable identity `requestGuardedAction` never changes, so consumers
  // don't re-render when the dialog opens/closes.
  const contextValue = useMemo<UnsavedChangesContextValue>(
    () => ({ sourceRef, requestGuardedAction }),
    [requestGuardedAction],
  );

  const isOpen = blocker.state === "blocked" || pendingAction !== null;

  const handleKeepEditing = useCallback(() => {
    setPendingAction(null);
    if (blocker.state === "blocked") blocker.reset();
  }, [blocker]);

  // Ref so handleDiscardChanges doesn't change identity on every render.
  const queuedActionRef = useRef<(() => void) | null>(null);
  queuedActionRef.current = pendingAction;

  const handleDiscardChanges = useCallback(() => {
    sourceRef.current?.discardChanges();
    const queued = queuedActionRef.current;
    setPendingAction(null);
    if (blocker.state === "blocked") {
      blocker.proceed();
      return;
    }
    queued?.();
  }, [blocker]);

  const handleSaveChanges = useCallback(() => {
    const queued = queuedActionRef.current;
    sourceRef.current?.saveChanges(
      blocker.state === "blocked" ? undefined : (queued ?? undefined),
    );
    setPendingAction(null);
    if (blocker.state === "blocked") blocker.reset();
  }, [blocker]);

  return (
    <UnsavedChangesContext.Provider value={contextValue}>
      {children}
      <UnsavedChangesDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleKeepEditing();
        }}
        onDiscardChanges={handleDiscardChanges}
        onKeepEditing={handleKeepEditing}
        onSaveChanges={handleSaveChanges}
      />
    </UnsavedChangesContext.Provider>
  );
}
