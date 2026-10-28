<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import { floatToTime } from "@/utils/format";
import WeekRow from "./WeekRow.vue";
import { canSubmitForApproval, TOTAL_HOURS_THEME } from "./constants";
import type {
  DayCell,
  TimesheetApprovalStatus,
  TotalHoursTheme,
  WeekGroupProps,
} from "./types";
import {
  computeWeekTotals,
  isDateBackdateRestricted,
  shortDates,
  today,
  type WeekTotals,
} from "./utils";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<WeekGroupProps>(), {
  label: "This Week",
  status: undefined,
  readOnly: false,
  tasks: () => ({}),
  leaves: () => [],
  holidays: () => [],
  workingHour: 0,
  workingFrequency: "Per Day",
  backdateRestrictedBefore: null,
  approvalPendingCount: 0,
  defaultCollapsed: false,
});

const emit = defineEmits<{
  /** The week's submit or resubmit button was pressed. */
  submit: [];
  /** The week was collapsed or expanded. */
  toggle: [collapsed: boolean];
}>();

defineSlots<{
  /** The week's rows, shown while it is expanded. */
  default?: (props: {
    totalHours: string;
    totalHoursTheme: TotalHoursTheme;
    /** The week's totals per day, off before the backdate limit. */
    totalCells: DayCell[];
    hoursPerDay: number[];
    dailyHours: number;
    status: TimesheetApprovalStatus | undefined;
  }) => unknown;
}>();

// Leaves room for the sticky header row when the week scrolls into view.
const STICKY_HEADER_OFFSET = 28;

const collapsed = ref(props.defaultCollapsed);
const weekEl = useTemplateRef<HTMLElement>("week");

const READ_ONLY_TOTALS: WeekTotals = {
  total: 0,
  cells: [],
  hoursPerDay: [],
  dailyHours: 0,
  theme: TOTAL_HOURS_THEME.none,
};

const totals = computed(() =>
  props.readOnly
    ? READ_ONLY_TOTALS
    : computeWeekTotals({
        dates: props.dates,
        tasks: props.tasks,
        leaves: props.leaves,
        holidays: props.holidays,
        workingHour: props.workingHour,
        workingFrequency: props.workingFrequency,
      }),
);

const totalCells = computed(() =>
  totals.value.cells.map((cell) => ({
    ...cell,
    disabled:
      cell.disabled ||
      isDateBackdateRestricted(cell.date ?? "", props.backdateRestrictedBefore),
  })),
);

const todayLabel = computed(() => {
  const date = today();
  return props.dates.includes(date) ? shortDates([date])[0] : "";
});

const badgeLabel = computed(() =>
  props.approvalPendingCount > 0
    ? `· ${props.approvalPendingCount} pending ${
        props.approvalPendingCount === 1 ? "approval" : "approvals"
      }`
    : undefined,
);

function scrollParent(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement;
  while (parent) {
    if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) return parent;
    parent = parent.parentElement;
  }
  return null;
}

// Collapsing a long week from below its top would leave the view far past it.
function anchorOnCollapse() {
  const week = weekEl.value;
  const root = week && scrollParent(week);
  if (!week || !root) return;
  const rootTop = root.getBoundingClientRect().top;
  if (week.getBoundingClientRect().top < rootTop + STICKY_HEADER_OFFSET) {
    week.scrollIntoView({ block: "start" });
  }
}

function onToggle(value: boolean) {
  collapsed.value = value;
  emit("toggle", value);
  if (value) anchorOnCollapse();
}

function onSubmit() {
  if (!props.readOnly && canSubmitForApproval(props.status)) emit("submit");
}
</script>

<template>
  <div ref="week" class="scroll-mt-7">
    <div class="sticky top-7 z-10 bg-surface-base">
      <WeekRow
        v-bind="$attrs"
        :label="label"
        :status="status"
        :dates="shortDates(dates)"
        :today="todayLabel"
        :this-week="todayLabel !== ''"
        :total-hours="floatToTime(totals.total)"
        :total-hours-theme="totals.theme"
        :badge-label="badgeLabel"
        :collapsed="collapsed"
        @update:collapsed="onToggle"
        @submit="onSubmit"
      />
    </div>
    <div v-if="!collapsed" class="pb-4">
      <slot
        :total-hours="floatToTime(totals.total)"
        :total-hours-theme="totals.theme"
        :total-cells="totalCells"
        :hours-per-day="totals.hoursPerDay"
        :daily-hours="totals.dailyHours"
        :status="status"
      />
    </div>
  </div>
</template>
