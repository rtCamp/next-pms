<script setup lang="ts">
import { computed } from "vue";
import { Tooltip } from "frappe-ui";
import TruncatedText from "@/pages/project-details/TruncatedText.vue";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import RagDot from "@/pages/projects/cells/RagDot.vue";
import { PROJECT_HEALTH_TOOLTIP } from "@/pages/projects/help";
import type { RagStatus } from "@/pages/projects/types";
import { useProjectSidebar } from "./useProjectSidebar";

const { doc } = useProjectDetails();
const { sidebar } = useProjectSidebar();

const healthTooltip = computed(
  () =>
    PROJECT_HEALTH_TOOLTIP[
      doc.value?.custom_project_rag_status?.toLowerCase() as RagStatus
    ] as string | undefined,
);

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
  <!-- eslint-disable better-tailwindcss/no-restricted-classes -- label column sized to its content, as React; no grid-cols step for auto 1fr -->
  <dl
    class="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-4.5 text-base leading-tighter text-ink-gray-5"
  >
    <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
    <template v-for="row in rows" :key="row.label">
      <dt>{{ row.label }}</dt>
      <dd class="flex min-w-0 items-center gap-2">
        <TruncatedText :text="row.value" class="flex-1 text-ink-gray-7" />
        <Tooltip v-if="row.rag && healthTooltip" :text="healthTooltip">
          <RagDot :status="doc?.custom_project_rag_status" />
        </Tooltip>
      </dd>
    </template>
  </dl>
</template>
