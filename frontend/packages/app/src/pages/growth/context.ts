/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type {
  GrowthStatusDoc,
  NamedDoc,
} from "@/pages/project-details/tabs/growth/types";
import {
  DEFAULT_PIPELINE_CURRENCY,
  DEFAULT_PIPELINE_FILTERS,
} from "./constants";
import type {
  PendingMove,
  PipelineClient,
  PipelineFilters,
  PipelineInitiative,
  PipelineSort,
  PipelineView,
  UsersByEmail,
} from "./types";

export interface PipelineContextProps {
  state: {
    view: PipelineView;
    filters: PipelineFilters;
    currency: string;
    sort: PipelineSort;
    initiatives: PipelineInitiative[];
    clients: Record<string, PipelineClient>;
    users: UsersByEmail;
    isLoading: boolean;
    error: unknown;
    openStatuses: GrowthStatusDoc[];
    closingStatus: string | null;
    closedOutcomes: NamedDoc[];
    pendingMove: PendingMove | null;
  };
  actions: {
    setView: (view: PipelineView) => void;
    setFilters: (filters: Partial<PipelineFilters>) => void;
    setCurrency: (currency: string) => void;
    setSort: (sort: PipelineSort) => void;
    openInitiative: (initiative: PipelineInitiative) => void;
    requestMove: (move: PendingMove) => void;
    cancelMove: () => void;
    refresh: () => void;
  };
}

const noop = () => {};

export const PipelineContext = createContext<PipelineContextProps>({
  state: {
    view: "board",
    filters: DEFAULT_PIPELINE_FILTERS,
    currency: DEFAULT_PIPELINE_CURRENCY,
    sort: "modified",
    initiatives: [],
    clients: {},
    users: {},
    isLoading: false,
    error: null,
    openStatuses: [],
    closingStatus: null,
    closedOutcomes: [],
    pendingMove: null,
  },
  actions: {
    setView: noop,
    setFilters: noop,
    setCurrency: noop,
    setSort: noop,
    openInitiative: noop,
    requestMove: noop,
    cancelMove: noop,
    refresh: noop,
  },
});

export const usePipeline = <T>(selector: (state: PipelineContextProps) => T) =>
  useContextSelector(PipelineContext, selector);
