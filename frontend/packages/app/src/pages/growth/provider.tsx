/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { useNavigate, useSearchParams } from "react-router";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import {
  DEFAULT_GROWTH_FILTERS,
  GROWTH_DETAIL_PARAM,
} from "@/pages/project-details/tabs/growth/constants";
import {
  GrowthContext,
  type GrowthContextProps,
} from "@/pages/project-details/tabs/growth/context";
import { useGrowthDialogs } from "@/pages/project-details/tabs/growth/useGrowthDialogs";
import { useGrowthMasters } from "@/pages/project-details/tabs/growth/useGrowthMasters";
import {
  DEFAULT_PIPELINE_CURRENCY,
  DEFAULT_PIPELINE_FILTERS,
  VIEW_PARAM,
} from "./constants";
import { PipelineContext, type PipelineContextProps } from "./context";
import type {
  PendingMove,
  PipelineFilters,
  PipelineInitiative,
  PipelineSort,
  PipelineView,
} from "./types";
import { usePipelineData } from "./usePipelineData";

const byCreation = (a: { creation: string }, b: { creation: string }) =>
  a.creation.localeCompare(b.creation);

const sortInitiatives = (items: PipelineInitiative[], sort: PipelineSort) =>
  sort === "modified"
    ? items
    : [...items].sort((a, b) =>
        sort === "activity"
          ? a.activity.localeCompare(b.activity)
          : b.converted_outcome - a.converted_outcome,
      );

const noop = () => {};

export function GrowthPipelineProvider({ children }: PropsWithChildren) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const view: PipelineView =
    searchParams.get(VIEW_PARAM) === "list" ? "list" : "board";
  const [filters, setFiltersState] = useState<PipelineFilters>(
    DEFAULT_PIPELINE_FILTERS,
  );
  const [currency, setCurrency] = useState(DEFAULT_PIPELINE_CURRENCY);
  const [sort, setSort] = useState<PipelineSort>("modified");
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  const { initiatives, clients, users, isLoading, error, mutate } =
    usePipelineData(filters, currency);
  const masters = useGrowthMasters();

  const refresh = useCallback(() => {
    void mutate();
  }, [mutate]);
  const dialogs = useGrowthDialogs(refresh);

  const setView = useCallback(
    (next: PipelineView) => {
      setSearchParams((prev) => {
        if (next === "list") prev.set(VIEW_PARAM, next);
        else prev.delete(VIEW_PARAM);
        return prev;
      });
    },
    [setSearchParams],
  );

  const setFilters = useCallback((partial: Partial<PipelineFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const openInitiative = useCallback(
    (initiative: PipelineInitiative) => {
      if (initiative.project) {
        navigate(
          `${ROUTES.project}/${initiative.project}?tab=growth&${GROWTH_DETAIL_PARAM}=${initiative.name}`,
        );
        return;
      }
      setSearchParams((prev) => {
        prev.set(GROWTH_DETAIL_PARAM, initiative.name);
        return prev;
      });
    },
    [navigate, setSearchParams],
  );
  const openDetail = useCallback(
    (name: string) => {
      const initiative = initiatives.find((item) => item.name === name);
      if (initiative) openInitiative(initiative);
    },
    [initiatives, openInitiative],
  );

  const cancelMove = useCallback(() => setPendingMove(null), []);

  const openStatuses = useMemo(
    () => masters.statuses.filter((s) => !s.is_closed).sort(byCreation),
    [masters.statuses],
  );
  const closingStatus = useMemo(
    () => masters.statuses.find((s) => s.is_closed)?.name ?? null,
    [masters.statuses],
  );
  const closedOutcomes = useMemo(
    () => [...masters.closedStatuses].sort(byCreation),
    [masters.closedStatuses],
  );
  const sortedInitiatives = useMemo(
    () => sortInitiatives(initiatives, sort),
    [initiatives, sort],
  );

  const pipelineValue = useMemo<PipelineContextProps>(
    () => ({
      state: {
        view,
        filters,
        currency,
        sort,
        initiatives: sortedInitiatives,
        clients,
        users,
        isLoading,
        error,
        openStatuses,
        closingStatus,
        closedOutcomes,
        pendingMove,
      },
      actions: {
        setView,
        setFilters,
        setCurrency,
        setSort,
        openInitiative,
        requestMove: setPendingMove,
        cancelMove,
        refresh,
      },
    }),
    [
      view,
      filters,
      currency,
      sort,
      sortedInitiatives,
      clients,
      users,
      isLoading,
      error,
      openStatuses,
      closingStatus,
      closedOutcomes,
      pendingMove,
      setView,
      setFilters,
      openInitiative,
      cancelMove,
      refresh,
    ],
  );

  const growthValue = useMemo<GrowthContextProps>(
    () => ({
      state: {
        data: [],
        isLoading,
        error,
        filters: DEFAULT_GROWTH_FILTERS,
        sort: null,
        activityOwnersWithDetails: {},
        projectManagersWithDetails: {},
        isCreateOpen: dialogs.isCreateOpen,
        createStatus: dialogs.createStatus,
        editName: dialogs.editName,
        deleteName: dialogs.deleteName,
        ...masters,
      },
      actions: {
        setFilters: noop,
        setSort: noop,
        refresh,
        openCreate: dialogs.openCreate,
        closeCreate: dialogs.closeCreate,
        openEdit: dialogs.openEdit,
        openDetail,
        openDelete: dialogs.openDelete,
        closeDelete: dialogs.closeDelete,
        deleteGrowth: dialogs.deleteGrowth,
      },
    }),
    [isLoading, error, dialogs, masters, refresh, openDetail],
  );

  return (
    <PipelineContext.Provider value={pipelineValue}>
      <GrowthContext.Provider value={growthValue}>
        {children}
      </GrowthContext.Provider>
    </PipelineContext.Provider>
  );
}
