/**
 * External dependencies.
 */
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Internal dependencies.
 */
import { FULL_DAY_HOURS } from "../constants";
import type { AllocationCallbackData } from "../types";
import { clamp, getBarDateRange, snapValue, type DraftBarSeed } from "../utils";

type CreateInteraction = {
  pointerId: number;
  startX: number;
  maxWidth: number;
  draft: DraftBarSeed;
};

type UseRowAllocationDraftOptions = {
  createDraftBar: (slotLeft: number) => DraftBarSeed;
  columnWidth: number;
  headerWidth: number;
  columnCount: number;
  maxRight: number;
  weekStart: Date;
  showWeekend: boolean;
  onOpenAllocation?: (data: AllocationCallbackData) => void;
  onDraftCreated?: () => void;
};

/**
 * Resolves the width of the draft allocation bar during drag-to-create, ensuring
 * it stays within bounds and optionally snapping to the grid.
 */
function resolveCreateWidth(
  interaction: CreateInteraction,
  clientX: number,
  columnWidth: number,
  snap = false,
) {
  const width = clamp(
    interaction.draft.width + (clientX - interaction.startX),
    columnWidth,
    interaction.maxWidth,
  );

  return snap
    ? clamp(snapValue(width, columnWidth), columnWidth, interaction.maxWidth)
    : width;
}

/**
 * Manages the draft allocation lifecycle for a row, including drag-to-create,
 * opening the modal from draft geometry, and removing the draft after save.
 */
export function useRowAllocationDraft({
  createDraftBar,
  columnWidth,
  headerWidth,
  columnCount,
  maxRight,
  weekStart,
  showWeekend,
  onOpenAllocation,
  onDraftCreated,
}: UseRowAllocationDraftOptions) {
  const [draft, setDraft] = useState<DraftBarSeed | null>(null);
  const createInteractionRef = useRef<CreateInteraction | null>(null);
  const removeListenersRef = useRef<(() => void) | null>(null);

  const removeDraft = useCallback(() => {
    setDraft(null);
  }, []);

  const openDraftAllocation = useCallback(
    (nextDraft: DraftBarSeed, width: number) => {
      if (!onOpenAllocation) {
        return;
      }

      const { startDate, endDate } = getBarDateRange({
        left: nextDraft.left,
        width,
        headerWidth,
        columnWidth,
        columnCount,
        weekStart,
        showWeekend,
      });

      onOpenAllocation({
        employeeId: nextDraft.employeeId,
        employeeName: nextDraft.employeeName,
        projectId: nextDraft.projectId,
        projectName: nextDraft.projectName,
        customerName: nextDraft.customerName,
        startDate,
        endDate,
        hoursPerDay: FULL_DAY_HOURS,
        onSuccess: removeDraft,
      });
    },
    [
      columnCount,
      columnWidth,
      headerWidth,
      onOpenAllocation,
      removeDraft,
      showWeekend,
      weekStart,
    ],
  );

  const createDraftAtSlot = useCallback(
    (slotLeft: number) => {
      onDraftCreated?.();
      const nextDraft = createDraftBar(slotLeft);
      setDraft(nextDraft);
      return nextDraft;
    },
    [createDraftBar, onDraftCreated],
  );

  const stopCreateInteraction = useCallback(() => {
    removeListenersRef.current?.();
    removeListenersRef.current = null;
    createInteractionRef.current = null;
    document.body.style.userSelect = "";
  }, []);

  const handleWindowPointerMove = useCallback(
    (event: PointerEvent) => {
      const interaction = createInteractionRef.current;
      if (!interaction || interaction.pointerId !== event.pointerId) {
        return;
      }

      const width = resolveCreateWidth(interaction, event.clientX, columnWidth);
      setDraft((prev) => (prev ? { ...prev, width } : prev));
    },
    [columnWidth],
  );

  const handleWindowPointerCancel = useCallback(
    (event: PointerEvent) => {
      const interaction = createInteractionRef.current;
      if (!interaction || interaction.pointerId !== event.pointerId) {
        return;
      }

      stopCreateInteraction();
    },
    [stopCreateInteraction],
  );

  const handleWindowPointerUp = useCallback(
    (event: PointerEvent) => {
      const interaction = createInteractionRef.current;
      if (!interaction || interaction.pointerId !== event.pointerId) {
        return;
      }

      const snappedWidth = resolveCreateWidth(
        interaction,
        event.clientX,
        columnWidth,
        true,
      );

      setDraft((prev) => (prev ? { ...prev, width: snappedWidth } : prev));
      stopCreateInteraction();
      openDraftAllocation(interaction.draft, snappedWidth);
    },
    [columnWidth, openDraftAllocation, stopCreateInteraction],
  );

  const startCreateInteraction = useCallback(
    (slotLeft: number, pointerId: number, clientX: number) => {
      const nextDraft = createDraftAtSlot(slotLeft);
      createInteractionRef.current = {
        pointerId,
        startX: clientX,
        maxWidth: maxRight - nextDraft.left,
        draft: nextDraft,
      };

      removeListenersRef.current?.();

      window.addEventListener("pointermove", handleWindowPointerMove);
      window.addEventListener("pointerup", handleWindowPointerUp);
      window.addEventListener("pointercancel", handleWindowPointerCancel);
      removeListenersRef.current = () => {
        window.removeEventListener("pointermove", handleWindowPointerMove);
        window.removeEventListener("pointerup", handleWindowPointerUp);
        window.removeEventListener("pointercancel", handleWindowPointerCancel);
      };

      document.body.style.userSelect = "none";
    },
    [
      createDraftAtSlot,
      handleWindowPointerCancel,
      handleWindowPointerMove,
      handleWindowPointerUp,
      maxRight,
    ],
  );

  useEffect(() => {
    return () => {
      removeListenersRef.current?.();
      document.body.style.userSelect = "";
    };
  }, []);

  const openDraftAtSlot = useCallback(
    (slotLeft: number) => {
      const nextDraft = createDraftAtSlot(slotLeft);
      openDraftAllocation(nextDraft, nextDraft.width);
    },
    [createDraftAtSlot, openDraftAllocation],
  );

  return {
    draft,
    removeDraft,
    openDraftAtSlot,
    startCreateInteraction,
  };
}
