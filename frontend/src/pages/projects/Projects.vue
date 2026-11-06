<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { Spinner } from "frappe-ui";
import AddProjectDialog from "./AddProjectDialog.vue";
import ProjectKanban from "./kanban/ProjectKanban.vue";
import ProjectFilters from "./ProjectFilters.vue";
import ProjectListView from "./ProjectListView.vue";
import ProjectsHeader from "./ProjectsHeader.vue";
import { defaultCurrency, useProjectFilters } from "./useProjectFilters";
import { provideProjectViews } from "./views/useProjectViews";
import ViewChanges from "./views/ViewChanges.vue";
import ViewDialog from "./views/ViewDialog.vue";
import ViewsDropdown from "./views/ViewsDropdown.vue";

defineOptions({ inheritAttrs: false });

const views = provideProjectViews();

// The default currency goes into the URL before the list mounts, so its first
// request already carries it.
const { filters, setCurrency } = useProjectFilters();
const currencyReady = ref(Boolean(filters.value.currency));
if (!currencyReady.value) {
  setCurrency(defaultCurrency()).finally(() => (currencyReady.value = true));
}

const listView = useTemplateRef("listView");
const kanbanView = useTemplateRef("kanbanView");
const addProjectOpen = ref(false);
const addProjectPhase = ref<string>();

function addProject(phase?: string) {
  addProjectPhase.value = phase;
  addProjectOpen.value = true;
}

function refresh() {
  listView.value?.refresh();
  kanbanView.value?.reload();
}
</script>

<template>
  <template v-if="views.activeView && currencyReady">
    <ProjectsHeader @add-project="addProject()">
      <template #breadcrumbs>
        <nav aria-label="Breadcrumb" class="flex min-w-0 items-center">
          <span class="px-0.5 py-1 text-lg-medium text-ink-gray-5">
            Projects
          </span>
          <span class="mx-0.5 text-base text-ink-gray-4" aria-hidden="true">
            /
          </span>
          <ViewsDropdown />
        </nav>
      </template>
    </ProjectsHeader>
    <ProjectFilters :kanban="views.isKanban">
      <template #actions>
        <ViewChanges />
      </template>
    </ProjectFilters>
    <ProjectKanban
      v-if="views.isKanban"
      ref="kanbanView"
      @add-project="addProject"
    />
    <ProjectListView v-else ref="listView" />
  </template>
  <div v-else class="flex h-64 items-center justify-center">
    <Spinner class="size-6" />
  </div>
  <ViewDialog />
  <AddProjectDialog
    v-model:open="addProjectOpen"
    :phase="addProjectPhase"
    @saved="refresh"
  />
</template>
