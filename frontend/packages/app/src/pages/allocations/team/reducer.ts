/**
 * External dependencies.
 */
import { addMonths, addWeeks } from "date-fns";

/**
 * Internal dependencies.
 */
import type { AllocationsDuration } from "./context";

const DURATION_WEEK_COUNT: Record<AllocationsDuration, number> = {
  "this-week": 1,
  "this-month": 4,
  "this-quarter": 13,
};

export interface AllocationsTeamState {
  searchInput: string;
  duration: AllocationsDuration;
  weekCount: number;
  anchorDate: Date;
}

export type AllocationsTeamAction =
  | { type: "SEARCH_CHANGED"; payload: string }
  | { type: "DURATION_CHANGED"; payload: AllocationsDuration }
  | { type: "MOVE_PREVIOUS" }
  | { type: "MOVE_NEXT" }
  | { type: "MOVE_TODAY" };

function moveDate(
  anchorDate: Date,
  duration: AllocationsDuration,
  next: boolean,
): Date {
  const delta = next ? 1 : -1;

  if (duration === "this-week") {
    return addWeeks(anchorDate, delta);
  }

  if (duration === "this-month") {
    return addMonths(anchorDate, delta);
  }

  if (duration === "this-quarter") {
    return addMonths(anchorDate, 3 * delta);
  }

  return anchorDate;
}

export function createInitialAllocationsTeamState(): AllocationsTeamState {
  return {
    searchInput: "",
    duration: "this-quarter",
    weekCount: DURATION_WEEK_COUNT["this-quarter"],
    anchorDate: new Date(),
  };
}

export function allocationsTeamReducer(
  state: AllocationsTeamState,
  action: AllocationsTeamAction,
): AllocationsTeamState {
  switch (action.type) {
    case "SEARCH_CHANGED":
      return {
        ...state,
        searchInput: action.payload,
      };

    case "DURATION_CHANGED":
      return {
        ...state,
        duration: action.payload,
        weekCount: DURATION_WEEK_COUNT[action.payload],
      };

    case "MOVE_PREVIOUS":
      return {
        ...state,
        anchorDate: moveDate(state.anchorDate, state.duration, false),
      };

    case "MOVE_NEXT":
      return {
        ...state,
        anchorDate: moveDate(state.anchorDate, state.duration, true),
      };

    case "MOVE_TODAY":
      return {
        ...state,
        anchorDate: new Date(),
      };

    default:
      return state;
  }
}
