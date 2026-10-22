<script setup lang="ts">
import { computed, watch } from "vue";
import { dayjs, useCall } from "frappe-ui";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import ClientBreakdown from "./ClientBreakdown.vue";
import { FEEDBACK_API, TIMELINE_LIMIT } from "./constants";
import {
  monthFeedbackId,
  monthKey,
  shiftWindow,
  timelineMonths,
  windowParams,
} from "./feedback";
import LoadError from "./LoadError.vue";
import MonthTimeline from "./MonthTimeline.vue";
import type { TimelineEntry, TimelineMonth } from "./types";
import { useClientFeedback } from "./useClientFeedback";

const { projectId } = useProjectDetails();
const { timelineWindow, selectedMonth, selectedFeedbackId } =
  useClientFeedback();

const timeline = useCall<TimelineEntry[], Record<string, unknown>>({
  url: `${FEEDBACK_API}.get_project_feedback_timeline`,
  params: () => ({
    project: projectId.value,
    ...windowParams(timelineWindow.value),
    limit: TIMELINE_LIMIT,
  }),
  refetch: true,
});

const months = computed(() =>
  timelineMonths(timelineWindow.value, timeline.data ?? []),
);

// As React: once the first timeline with schedules arrives, pick the selected
// month's feedback.
let preselected = false;
watch(
  () => timeline.data,
  (entries) => {
    if (preselected || !entries?.length) return;
    selectedFeedbackId.value = monthFeedbackId(selectedMonth.value, entries);
    preselected = true;
  },
  { immediate: true },
);

function slide(months: number) {
  timelineWindow.value = shiftWindow(timelineWindow.value, months);
}

function select(month: TimelineMonth) {
  selectedMonth.value = { year: month.year, month: month.month };
  selectedFeedbackId.value = month.feedbackId;
}

const monthName = computed(() =>
  dayjs(new Date(selectedMonth.value.year, selectedMonth.value.month)).format(
    "MMMM",
  ),
);
</script>

<template>
  <div>
    <LoadError
      v-if="timeline.error"
      title="Couldn't load the feedback timeline"
      :error="timeline.error"
      @retry="timeline.reload()"
    />
    <MonthTimeline
      v-else
      :months="months"
      :loading="timeline.loading && !timeline.data"
      :selected="monthKey(selectedMonth)"
      @select="select"
      @slide="slide"
    />
    <p
      v-if="!selectedFeedbackId"
      class="p-4 text-center text-base text-ink-gray-5"
    >
      No feedback submitted for this month.
    </p>
    <ClientBreakdown
      v-else
      :key="selectedFeedbackId"
      :feedback-id="selectedFeedbackId"
      :month-name="monthName"
    />
  </div>
</template>
