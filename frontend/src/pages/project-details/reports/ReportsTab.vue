<script setup lang="ts">
import { computed } from "vue";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import ReportForm from "./ReportForm.vue";
import ReportsTable from "./ReportsTable.vue";
import { useReportUpdates } from "./useReportUpdates";

const { projectId, doc, reload } = useProjectDetails();

const reports = computed(() => doc.value?.custom_project_reports ?? []);
const generating = computed(() =>
  reports.value.some((report) => report.status === "Generating"),
);

useReportUpdates({ projectId, generating, reload });
</script>

<template>
  <div class="flex flex-col gap-6 p-4">
    <ReportForm :generating="generating" />
    <ReportsTable :reports="reports" @resync="reload()" />
  </div>
</template>
