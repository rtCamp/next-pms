<script setup lang="ts">
import { computed } from "vue";
import { Breadcrumbs, PageHeaderBase } from "frappe-ui";
import { useProjectDetails } from "./useProjectDetails";

const { projectId, doc } = useProjectDetails();

const items = computed(() => [
  { label: "Projects", route: "/projects" },
  {
    label: doc.value?.project_name || projectId.value,
    route: `/projects/${encodeURIComponent(projectId.value)}`,
    isProject: true,
  },
]);
</script>

<template>
  <PageHeaderBase class="z-10 border-b border-outline-gray-1 bg-surface-base">
    <nav aria-label="Breadcrumb" class="flex h-14 items-center px-3 py-2">
      <Breadcrumbs :items="items">
        <template #prefix="{ item }">
          <span
            v-if="item.isProject"
            class="lucide-folder mr-1 size-4"
            aria-hidden="true"
          />
        </template>
      </Breadcrumbs>
    </nav>
  </PageHeaderBase>
</template>
