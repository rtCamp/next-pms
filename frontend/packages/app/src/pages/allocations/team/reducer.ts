/**
 * External dependencies.
 */
import type { Member } from "@next-pms/design-system/components";
import { addMonths, addWeeks } from "date-fns";

/**
 * Internal dependencies.
 */
import type { AllocationsDuration } from "./context";
import { mergeUniqueMembers } from "./utils";

const DURATION_WEEK_COUNT: Record<AllocationsDuration, number> = {
  "this-week": 1,
  "this-month": 4,
  "this-quarter": 13,
  "all-time": 100,
};

const EMPLOYEES_PER_PAGE = 10;

export interface AllocationsTeamState {
  members: Member[];
  filteredMembers: Member[];
  isLoading: boolean;
  hasMore: boolean;
  totalCount: number;
  searchInput: string;
  duration: AllocationsDuration;
  weekCount: number;
  anchorDate: Date;
  start: number;
  pageLength: number;
  isFilterRequest: boolean;
  isLoadMoreRequest: boolean;
}

export type AllocationsTeamAction =
  | { type: "SEARCH_CHANGED"; payload: string }
  | { type: "DURATION_CHANGED"; payload: AllocationsDuration }
  | { type: "LOAD_MORE" }
  | { type: "MOVE_PREVIOUS" }
  | { type: "MOVE_NEXT" }
  | { type: "MOVE_TODAY" }
  | { type: "DATA_LOADING" }
  | {
      type: "DATA_LOADED";
      payload: { members: Member[]; hasMore: boolean; totalCount: number };
    }
  | { type: "DATA_LOAD_FAILED" };

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
    members: [],
    filteredMembers: [],
    isLoading: false,
    hasMore: true,
    totalCount: 0,
    searchInput: "",
    duration: "this-quarter",
    weekCount: DURATION_WEEK_COUNT["this-quarter"],
    anchorDate: new Date(),
    start: 0,
    pageLength: EMPLOYEES_PER_PAGE,
    isFilterRequest: false,
    isLoadMoreRequest: false,
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
        start: 0,
        isFilterRequest: true,
        isLoadMoreRequest: false,
      };

    case "DURATION_CHANGED":
      return {
        ...state,
        duration: action.payload,
        weekCount: DURATION_WEEK_COUNT[action.payload],
        start: 0,
        isFilterRequest: true,
        isLoadMoreRequest: false,
      };

    case "LOAD_MORE":
      if (state.isLoading || !state.hasMore) {
        return state;
      }

      return {
        ...state,
        start: state.start + state.pageLength,
        isFilterRequest: false,
        isLoadMoreRequest: true,
      };

    case "MOVE_PREVIOUS":
      return {
        ...state,
        anchorDate: moveDate(state.anchorDate, state.duration, false),
        start: 0,
        isFilterRequest: true,
        isLoadMoreRequest: false,
      };

    case "MOVE_NEXT":
      return {
        ...state,
        anchorDate: moveDate(state.anchorDate, state.duration, true),
        start: 0,
        isFilterRequest: true,
        isLoadMoreRequest: false,
      };

    case "MOVE_TODAY":
      return {
        ...state,
        anchorDate: new Date(),
        start: 0,
        isFilterRequest: true,
        isLoadMoreRequest: false,
      };

    case "DATA_LOADING":
      return {
        ...state,
        isLoading: true,
      };

    case "DATA_LOADED": {
      const members = state.isLoadMoreRequest
        ? mergeUniqueMembers(state.members, action.payload.members)
        : action.payload.members;

      return {
        ...state,
        isLoading: false,
        hasMore: action.payload.hasMore,
        totalCount: action.payload.totalCount,
        isFilterRequest: false,
        isLoadMoreRequest: false,
        members,
        filteredMembers: members,
      };
    }

    case "DATA_LOAD_FAILED":
      return {
        ...state,
        isLoading: false,
        isFilterRequest: false,
        isLoadMoreRequest: false,
      };

    default:
      return state;
  }
}
