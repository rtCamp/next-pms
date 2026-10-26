<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch, type Component } from "vue";
import { useRoute } from "vue-router";
import {
  Button,
  FrappeResponseError,
  Spinner,
  TabList,
  TabPanel,
  Tabs,
  TabTrigger,
} from "frappe-ui";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { useQueryPatch } from "@/composables/useQueryPatch";
import { provideUnsavedChanges } from "@/composables/useUnsavedChanges";
import StatusMessage from "@/layout/StatusMessage.vue";
import { errorMessage } from "@/utils/errors";
import { queryString } from "@/utils/query";
import AboutSidebar from "./about/AboutSidebar.vue";
import CalendarTab from "./calendar/CalendarTab.vue";
import {
  SEARCH_PARAM,
  TYPE_PARAM,
  VIEW_PARAM as CALENDAR_VIEW_PARAM,
} from "./calendar/constants";
import { DEFAULT_TAB, TAB_PARAM, type ProjectTabKey } from "./constants";
import EmailTab from "./email/EmailTab.vue";
import { VIEW_PARAM } from "./feedback/constants";
import FeedbackTab from "./feedback/FeedbackTab.vue";
import { NOTE_PARAM } from "./notes/constants";
import NotesTab from "./notes/NotesTab.vue";
import OverviewTab from "./overview/OverviewTab.vue";
import ProjectDetailsHeader from "./ProjectDetailsHeader.vue";
import RagStatsTab from "./rag-stats/RagStatsTab.vue";
import ReportsTab from "./reports/ReportsTab.vue";
import { RISK_PARAM } from "./risks/constants";
import RisksTab from "./risks/RisksTab.vue";
import { selectedTab, visibleTabs } from "./tabs";
import TodoDialog from "./to-do/TodoDialog.vue";
import TodosTab from "./to-do/TodosTab.vue";
import { provideTodos } from "./to-do/useTodos";
import TrackingTab from "./tracking/TrackingTab.vue";
import { provideCommentMentions } from "./useProjectComments";
import { provideProjectDetails } from "./useProjectDetails";

defineOptions({ inheritAttrs: false });

const TAB_PANELS: Partial<Record<ProjectTabKey, Component>> = {
  overview: OverviewTab,
  calendar: CalendarTab,
  email: EmailTab,
  "rag-stats": RagStatsTab,
  reports: ReportsTab,
  tracking: TrackingTab,
  "to-do": TodosTab,
  feedback: FeedbackTab,
  notes: NotesTab,
  risks: RisksTab,
};

const route = useRoute();
const patchQuery = useQueryPatch();

// Read once: another project remounts the page (App.vue keys the route view by
// project), and a write still queued as this page unmounts must not follow the URL.
const projectId = String(route.params.projectId ?? "");
const { doc, error, reload } = provideProjectDetails(projectId);
const unsavedChanges = provideUnsavedChanges();
provideTodos(projectId);
provideCommentMentions();

const errorType = computed(() =>
  error.value instanceof FrappeResponseError ? error.value.type : null,
);

const tabs = computed(() =>
  visibleTabs({
    hasCustomerFeedback: Boolean(window.boot?.has_customer_feedback),
    showRagStats: Boolean(window.boot?.show_rag_trigger_page),
    reportsEnabled: Boolean(doc.value?.custom_enable_project_report_generation),
  }),
);

/** Whether a note editor route (a child route) is open in place of the tabs. */
const editorOpen = computed(() => route.matched.length > 1);

const tabParam = computed(() => queryString(route.query[TAB_PARAM]));
const activeTab = computed(() => selectedTab(tabParam.value, tabs.value));

function selectTab(value: string | number) {
  const key = value as ProjectTabKey;
  // Reka emits on a click or key press on the selected tab too.
  if (key === activeTab.value) return;
  patchQuery(
    {
      [TAB_PARAM]: key === DEFAULT_TAB ? null : key,
      // Leaving Feedback, Calendar, Notes or Risks drops its view (the Calendar's table
      // tab and search, the open note or risk), so coming back opens the default view.
      ...(activeTab.value === "feedback" && { [VIEW_PARAM]: null }),
      ...(activeTab.value === "notes" && { [NOTE_PARAM]: null }),
      ...(activeTab.value === "risks" && { [RISK_PARAM]: null }),
      ...(activeTab.value === "calendar" && {
        [CALENDAR_VIEW_PARAM]: null,
        [TYPE_PARAM]: null,
        [SEARCH_PARAM]: null,
      }),
    },
    { push: true },
  );
}

// An unknown or hidden tab leaves the URL once the project (and so the Reports
// flag) has loaded, as in React.
watch(
  [doc, tabParam, editorOpen],
  () => {
    if (
      doc.value &&
      !editorOpen.value &&
      tabParam.value &&
      tabParam.value !== activeTab.value
    ) {
      patchQuery({ [TAB_PARAM]: null });
    }
  },
  { immediate: true },
);

const tabBar = useTemplateRef<HTMLElement>("tabBar");

watch(
  [activeTab, tabBar],
  async () => {
    await nextTick();
    tabBar.value
      ?.querySelector('[role="tab"][aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  },
  { immediate: true },
);

// React titles the tab with the bare project name. Re-applied after every
// navigation, which resets the title from the route meta.
watch(
  [() => doc.value?.project_name, () => route.fullPath],
  ([projectName]) => {
    if (projectName) document.title = projectName;
  },
  { immediate: true },
);
</script>

<template>
  <ProjectDetailsHeader />
  <div v-if="doc" class="flex min-h-0 flex-1 max-md:overflow-x-auto">
    <div v-if="editorOpen" class="min-h-0 flex-1 overflow-auto">
      <RouterView v-slot="{ Component: editor, route: editorRoute }">
        <component :is="editor" :key="editorRoute.fullPath" />
      </RouterView>
    </div>
    <Tabs
      v-else
      :model-value="activeTab"
      class="flex w-3/4 flex-col border-r border-outline-elevation-2 max-md:min-w-full"
      @update:model-value="selectTab"
    >
      <div ref="tabBar" class="shrink-0 overflow-x-auto">
        <TabList class="h-10 min-w-max px-5">
          <TabTrigger
            v-for="tab in tabs"
            :key="tab.value"
            :value="tab.value"
            :label="tab.label"
          />
        </TabList>
      </div>
      <TabPanel
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        class="min-h-0 flex-1 overflow-auto px-5 py-4"
      >
        <component :is="TAB_PANELS[tab.value]" v-if="TAB_PANELS[tab.value]" />
        <p v-else class="py-10 text-center text-p-sm text-ink-gray-5">
          Not ported yet
        </p>
      </TabPanel>
    </Tabs>
    <AboutSidebar class="w-1/4 max-md:min-w-60 max-md:shrink-0" />
  </div>
  <StatusMessage
    v-else-if="errorType === 'DoesNotExistError'"
    icon="lucide-folder-x"
    title="Project not found"
    :description="`There's no project ${projectId}.`"
  >
    <Button
      icon-left="lucide-arrow-left"
      label="All projects"
      route="/projects"
    />
  </StatusMessage>
  <StatusMessage
    v-else-if="errorType === 'PermissionError'"
    icon="lucide-lock"
    title="No access"
    description="You don't have permission to view this project."
  >
    <Button
      icon-left="lucide-arrow-left"
      label="All projects"
      route="/projects"
    />
  </StatusMessage>
  <StatusMessage
    v-else-if="error"
    icon="lucide-triangle-alert"
    title="Couldn't load the project"
    :description="errorMessage(error)"
  >
    <Button icon-left="lucide-refresh-cw" label="Try again" @click="reload()" />
  </StatusMessage>
  <div v-else class="flex h-64 items-center justify-center">
    <Spinner class="size-6" />
  </div>
  <UnsavedChangesDialog
    :open="unsavedChanges.dialogOpen.value"
    @keep-editing="unsavedChanges.keepEditing()"
    @discard="unsavedChanges.discardChanges()"
    @save="unsavedChanges.saveChanges()"
  />
  <TodoDialog />
</template>
