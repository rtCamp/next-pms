<script setup lang="ts">
import { Spinner, useCall } from "frappe-ui";
import { ErrorFallback } from "@/components/ErrorFallback";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { errorMessage } from "@/utils/errors";
import {
  HISTORY_COLUMNS,
  RAG_API,
  RAG_COLOUR_CLASS,
  TRIGGER_COLUMNS,
} from "./constants";
import RagComments from "./RagComments.vue";
import RagStatusTable from "./RagStatusTable.vue";
import type { RagDetails, RagHistory } from "./types";

const { projectId } = useProjectDetails();

const details = useCall<RagDetails, { project: string }>({
  url: `${RAG_API}.get_project_rag_details`,
  params: () => ({ project: projectId.value }),
  refetch: true,
});
</script>

<template>
  <div
    v-if="details.loading && !details.data"
    class="flex items-center justify-center py-16"
  >
    <Spinner class="size-6" />
  </div>
  <p v-else-if="details.error" class="text-base text-ink-red-6">
    {{ errorMessage(details.error) || "Failed to load RAG status details." }}
  </p>
  <div v-else class="flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <h2 class="text-2xl-semibold text-ink-gray-7">RAG Status Details</h2>
      <p class="text-sm-medium text-ink-gray-6">
        Below are all trigger thresholds causing RAG status to be impacted
      </p>
    </div>

    <div class="flex flex-col gap-4 space-y-10 rounded-7">
      <div class="flex items-center gap-1.5 text-base text-ink-gray-7">
        <span>Current Status:</span>
        <span
          v-if="details.data?.current_status"
          :class="[
            'font-medium',
            RAG_COLOUR_CLASS[details.data.current_status],
          ]"
        >
          {{ details.data.current_status }}
        </span>
        <span v-else class="font-medium text-ink-gray-5">N/A</span>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-base-medium text-ink-gray-8">Status Triggers:</span>
        <RagStatusTable
          label="Status triggers"
          :columns="TRIGGER_COLUMNS"
          :rows="details.data?.triggers ?? []"
          :row-key="(row) => row.type"
          empty-message="No active triggers."
        />
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-base-medium text-ink-gray-8">Status History:</span>
        <RagStatusTable
          label="Status history"
          :columns="HISTORY_COLUMNS"
          :rows="details.data?.history ?? []"
          :row-key="
            (row) => `${row.type}-${(row as RagHistory).clear_date ?? ''}`
          "
          empty-message="No cleared triggers yet."
        />
      </div>
    </div>

    <ErrorFallback>
      <RagComments
        :comments="details.data?.comments ?? []"
        :is-reloading="details.loading"
        :reload="() => details.reload()"
      />
    </ErrorFallback>
  </div>
</template>
