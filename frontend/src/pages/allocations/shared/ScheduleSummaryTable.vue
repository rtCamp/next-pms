<script setup lang="ts">
import { Tooltip } from "frappe-ui";
import {
  formatScheduleRange,
  rangeHours,
  toDisplayHours,
  type SchedulePreviewRow,
} from "./schedule";

const props = defineProps<{
  rows: SchedulePreviewRow[];
  /** `day` names weekdays, for edits that apply to every week of a series. */
  variant: "date" | "day";
  includeWeekends: boolean;
}>();

function rangeLabel(row: SchedulePreviewRow) {
  return formatScheduleRange(row.startDate, row.endDate, props.variant);
}

function totalLabel(row: SchedulePreviewRow) {
  return toDisplayHours(
    rangeHours(
      row.startDate,
      row.endDate,
      row.hoursPerDay,
      props.includeWeekends,
    ),
  );
}
</script>

<template>
  <div class="overflow-hidden rounded-4 border border-outline-gray-2">
    <table class="relative w-full table-fixed border-collapse">
      <thead class="sr-only">
        <tr>
          <th scope="col">Date range</th>
          <th scope="col">Hours</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="`${row.startDate}_${row.endDate}`"
          class="h-8 border-b border-outline-gray-2 transition-opacity last:border-b-0"
          :class="[
            row.isSelected && 'bg-surface-gray-3',
            row.isSelected && !row.isModified && 'opacity-50',
          ]"
        >
          <td
            class="w-1/2 truncate border-r border-outline-gray-2 px-2 py-2 text-base text-ink-gray-6"
          >
            <Tooltip
              :text="
                row.dayOffLabel
                  ? `${rangeLabel(row)} · ${row.dayOffLabel}`
                  : rangeLabel(row)
              "
            >
              <span class="block truncate">
                {{ rangeLabel(row) }}
                <span v-if="row.dayOffLabel" class="text-ink-gray-5">
                  · {{ row.dayOffLabel }}
                </span>
              </span>
            </Tooltip>
          </td>
          <td class="w-1/2 px-2 py-2 text-base">
            <span class="text-ink-gray-6"
              >{{ toDisplayHours(row.hoursPerDay) }}h/day</span
            >
            <span class="text-ink-gray-5"> · {{ totalLabel(row) }} hours</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
