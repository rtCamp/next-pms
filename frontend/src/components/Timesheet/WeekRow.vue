<script setup lang="ts">
import { computed } from "vue";
import { Badge, Button } from "frappe-ui";
import RowToggle from "./RowToggle.vue";
import {
  ACTION_CELL_CLASS,
  ACTION_TEXT_CLASS,
  APPROVAL_STATUS_LABEL,
  APPROVAL_STATUS_THEME,
  CELL_CLASS,
  GHOST_ACTION_CLASS,
  ROW_CLASS,
  WEEK_ACTION,
  WEEK_TOTAL_CLASS,
} from "./constants";
import type { WeekRowProps } from "./types";

const props = withDefaults(defineProps<WeekRowProps>(), {
  label: "This Week",
  status: "not-submitted",
  thisWeek: false,
  today: "",
  totalHours: "",
});

const collapsed = defineModel<boolean>("collapsed", { default: false });

defineEmits<{ action: [] }>();

const action = computed(() => WEEK_ACTION[props.status]);

const totalClass = computed(() => {
  if (!collapsed.value) return "";
  const colour =
    props.status === "approval-pending" && !props.thisWeek
      ? "text-ink-red-4"
      : WEEK_TOTAL_CLASS[props.status];
  return ["text-base-medium lining-nums tabular-nums", colour];
});

const actionClass = computed(() => {
  if (action.value.variant !== "ghost") return "";
  const tint =
    props.status === "rejected" && !props.thisWeek && !collapsed.value
      ? "!text-ink-gray-5"
      : ACTION_TEXT_CLASS[props.status];
  return [GHOST_ACTION_CLASS, tint];
});

function splitDate(date: string) {
  const [month, day] = date.split(" ");
  return { month, day };
}
</script>

<template>
  <div :class="ROW_CLASS" data-testid="week-row">
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <RowToggle
        label="Toggle week"
        :collapsed="collapsed"
        @click="collapsed = !collapsed"
      />
      <div class="flex min-w-0 items-center gap-2">
        <span class="truncate text-base-medium text-ink-gray-9">
          {{ label }}
        </span>
        <Badge
          v-if="status !== 'none'"
          class="shrink-0"
          :theme="APPROVAL_STATUS_THEME[status]"
          :label="APPROVAL_STATUS_LABEL[status]"
        />
      </div>
    </div>

    <template v-if="!collapsed">
      <div
        v-for="date in dates"
        :key="date"
        :class="[CELL_CLASS, 'text-sm text-ink-gray-5']"
        :aria-current="thisWeek && date === today ? 'date' : undefined"
      >
        <span>
          {{ splitDate(date).month }}
          <span
            :class="
              thisWeek &&
              date === today &&
              'rounded-1 bg-surface-red-5 px-1 py-px text-ink-base dark:text-ink-gray-9'
            "
            >{{ splitDate(date).day }}</span
          >
        </span>
      </div>
    </template>

    <div
      v-if="!(status === 'none' && collapsed)"
      :class="[CELL_CLASS, 'text-sm text-ink-gray-5']"
    >
      <span :class="totalClass">{{ collapsed ? totalHours : "Total" }}</span>
    </div>

    <div :class="ACTION_CELL_CLASS">
      <Button
        v-if="action.icon"
        size="sm"
        :variant="action.variant"
        :icon="action.icon"
        :class="actionClass"
        :aria-label="action.label"
        :title="APPROVAL_STATUS_LABEL[status]"
        @click="$emit('action')"
      />
    </div>
  </div>
</template>
