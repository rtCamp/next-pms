import {
  DEFAULT_TAB,
  PROJECT_TABS,
  type ProjectTab,
  type ProjectTabKey,
} from "./constants";

interface TabFlags {
  /** `boot.has_customer_feedback` */
  hasCustomerFeedback: boolean;
  /** `boot.show_rag_trigger_page` */
  showRagStats: boolean;
  /** The project's `custom_enable_project_report_generation` */
  reportsEnabled: boolean;
}

/** The tabs this project shows: Feedback, RAG stats and Reports only when enabled. */
export function visibleTabs(flags: TabFlags): ProjectTab[] {
  return PROJECT_TABS.filter((tab) => {
    if (tab.value === "feedback") return flags.hasCustomerFeedback;
    if (tab.value === "rag-stats") return flags.showRagStats;
    if (tab.value === "reports") return flags.reportsEnabled;
    return true;
  });
}

/** The tab a `?tab=` value selects: itself when it is visible, else the default. */
export function selectedTab(
  param: string,
  tabs: readonly ProjectTab[],
): ProjectTabKey {
  return tabs.find((tab) => tab.value === param)?.value ?? DEFAULT_TAB;
}
