<script setup lang="ts">
import { computed } from "vue";
import { floatToTime } from "@/utils/format";
import TimeOffRow from "./TimeOffRow.vue";
import type { TimeOffWeekRowProps } from "./types";
import { computeTimeOffCells } from "./utils";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<TimeOffWeekRowProps>(), {
  label: "Time-off",
});

const timeOff = computed(() =>
  computeTimeOffCells({
    dates: props.dates,
    leaves: props.leaves,
    holidays: props.holidays,
    dailyHours: props.dailyHours,
  }),
);
</script>

<template>
  <TimeOffRow
    v-if="timeOff.visible"
    v-bind="$attrs"
    :label="label"
    :time-off-entries="timeOff.cells"
    :total-hours="floatToTime(timeOff.total)"
  />
</template>
