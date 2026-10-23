<script setup lang="ts">
import { computed, ref } from "vue";
import { floatToTime } from "@/utils/format";
import MemberRow from "./MemberRow.vue";
import type { MemberGroupProps } from "./types";
import { computeWeekTotals, isDateBackdateRestricted } from "./utils";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<MemberGroupProps>(), {
  avatarUrl: undefined,
  status: undefined,
  disabled: false,
  backdateRestrictedBefore: null,
  hideAction: false,
  defaultCollapsed: true,
});

const emit = defineEmits<{
  /** The member's approval button was pressed. */
  action: [];
  /** A day's add-time button was pressed. */
  cellClick: [date: string];
}>();

defineSlots<{
  /** The member's projects and time off, shown while expanded. */
  default?: (props: { hoursPerDay: number[]; dailyHours: number }) => unknown;
}>();

const collapsed = ref(props.defaultCollapsed);

const totals = computed(() =>
  computeWeekTotals({
    dates: props.dates,
    tasks: props.tasks,
    leaves: props.leaves,
    holidays: props.holidays,
    workingHour: props.workingHour,
    workingFrequency: props.workingFrequency,
  }),
);

const cells = computed(() =>
  totals.value.cells.map((cell) => ({
    ...cell,
    disabled:
      props.disabled ||
      cell.disabled ||
      isDateBackdateRestricted(cell.date ?? "", props.backdateRestrictedBefore),
  })),
);
</script>

<template>
  <MemberRow
    v-bind="$attrs"
    v-model:collapsed="collapsed"
    :label="label"
    :avatar-url="avatarUrl"
    :status="status"
    :time-entries="cells"
    :total-hours="floatToTime(totals.total)"
    :total-hours-theme="totals.theme"
    :hide-action="hideAction"
    @action="emit('action')"
    @cell-click="(_, date) => emit('cellClick', date ?? '')"
  />
  <template v-if="!collapsed">
    <slot
      :hours-per-day="totals.hoursPerDay"
      :daily-hours="totals.dailyHours"
    />
  </template>
</template>
