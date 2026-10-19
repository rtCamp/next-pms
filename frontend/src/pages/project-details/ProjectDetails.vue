<script setup lang="ts">
import { computed, watch, type Component } from "vue";
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
import { useQueryPatch } from "@/composables/useQueryPatch";
import StatusMessage from "@/layout/StatusMessage.vue";
import { errorMessage } from "@/utils/errors";
import { queryString } from "@/utils/query";
import { DEFAULT_TAB, TAB_PARAM, type ProjectTabKey } from "./constants";
import EmailTab from "./email/EmailTab.vue";
import ProjectDetailsHeader from "./ProjectDetailsHeader.vue";
import RagStatsTab from "./rag-stats/RagStatsTab.vue";
import { selectedTab, visibleTabs } from "./tabs";
import { provideProjectDetails } from "./useProjectDetails";

defineOptions({ inheritAttrs: false });

const TAB_PANELS: Partial<Record<ProjectTabKey, Component>> = {
  email: EmailTab,
  "rag-stats": RagStatsTab,
};

const route = useRoute();
const patchQuery = useQueryPatch();

const projectId = computed(() => String(route.params.projectId ?? ""));
const { doc, error, reload } = provideProjectDetails(projectId);

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

const tabParam = computed(() => queryString(route.query[TAB_PARAM]));
const activeTab = computed(() => selectedTab(tabParam.value, tabs.value));

function selectTab(value: string | number) {
  const key = value as ProjectTabKey;
  patchQuery({ [TAB_PARAM]: key === DEFAULT_TAB ? null : key }, { push: true });
}

// An unknown or hidden tab leaves the URL once the project (and so the Reports
// flag) has loaded, as in React.
watch(
  [doc, tabParam],
  () => {
    if (doc.value && tabParam.value && tabParam.value !== activeTab.value) {
      patchQuery({ [TAB_PARAM]: null });
    }
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
    <Tabs
      :model-value="activeTab"
      class="flex w-3/4 flex-col border-r border-outline-elevation-2 max-md:min-w-full"
      @update:model-value="selectTab"
    >
      <TabList class="shrink-0 overflow-x-auto px-5">
        <TabTrigger
          v-for="tab in tabs"
          :key="tab.value"
          :value="tab.value"
          :label="tab.label"
        />
      </TabList>
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
    <div class="w-1/4 max-md:min-w-60 max-md:shrink-0" />
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
</template>
