<script setup lang="ts">
import { computed } from "vue";
import TruncatedText from "@/pages/project-details/TruncatedText.vue";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import RagDot from "@/pages/projects/cells/RagDot.vue";
import { useProjectSidebar } from "./useProjectSidebar";

const { doc } = useProjectDetails();
const { sidebar } = useProjectSidebar();

const rows = computed(() => {
  const details = sidebar.value?.details;
  return [
    { label: "Financial company", value: details?.company ?? "" },
    { label: "Project name", value: details?.project_name ?? "", rag: true },
    { label: "Customer", value: details?.customer ?? "" },
    { label: "Project status", value: details?.status ?? "" },
    { label: "Current phase", value: details?.phase ?? "" },
  ];
});
</script>

<template>
  <dl
    class="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-4.5 text-base leading-tighter text-ink-gray-5"
  >
    <template v-for="row in rows" :key="row.label">
      <dt>{{ row.label }}</dt>
      <dd class="flex min-w-0 items-center gap-2">
        <TruncatedText :text="row.value" class="flex-1 text-ink-gray-7" />
        <RagDot v-if="row.rag" :status="doc?.custom_project_rag_status" />
      </dd>
    </template>
  </dl>
</template>
