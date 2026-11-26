<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "frappe-ui";
import { ApprovalStatus } from "@/components/ApprovalStatus";
import RowToggle from "./RowToggle.vue";
import StatusActionButton from "./StatusActionButton.vue";
import {
  ACTION_CELL_CLASS,
  APPROVAL_STATUS_BADGE,
  CELL_CLASS,
  ROW_CLASS,
  SOLID_ACTION_ICON,
  SUBMIT_ACTION_LABEL,
  toApprovalStatus,
  totalHoursClass,
} from "./constants";
import type { WeekRowProps } from "./types";

const props = withDefaults(defineProps<WeekRowProps>(), {
  label: "This Week",
  thisWeek: false,
  today: "",
  totalHours: "",
});

const collapsed = defineModel<boolean>("collapsed", { default: false });

const emit = defineEmits<{
  /** The week's submit or resubmit button was pressed. */
  submit: [];
}>();

const shownStatus = computed(() => toApprovalStatus(props.status));

const submitLabel = computed(
  () => shownStatus.value && SUBMIT_ACTION_LABEL[shownStatus.value],
);

// React greys the resubmit icon on an open, earlier rejected week.
const actionIconClass = computed(() =>
  shownStatus.value === "Rejected" && !props.thisWeek && !collapsed.value
    ? "text-ink-gray-5"
    : undefined,
);

function splitDate(date: string) {
  const [month, day] = date.split(" ");
  return { month, day };
}
</script>

<template>
  <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -- a pointer shortcut; the chevron button is the keyboard control -->
  <div :class="[ROW_CLASS, 'cursor-pointer']" @click="collapsed = !collapsed">
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <RowToggle :label="`Toggle ${label}`" :collapsed="collapsed" />
      <div class="flex min-w-0 max-w-75 items-center gap-2 sm:max-w-112">
        <span class="truncate text-base-medium text-ink-gray-8">
          {{ label }}
        </span>
        <Badge
          v-if="shownStatus"
          class="shrink-0"
          :theme="APPROVAL_STATUS_BADGE[shownStatus].theme"
          :label="APPROVAL_STATUS_BADGE[shownStatus].label"
        />
        <span
          v-if="badgeLabel"
          class="shrink-0 whitespace-nowrap text-base text-ink-gray-5"
        >
          {{ badgeLabel }}
        </span>
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
              'rounded-1 bg-surface-red-7 px-1 py-px text-ink-base dark:text-ink-red-9'
            "
            >{{ splitDate(date).day }}</span
          >
        </span>
      </div>
    </template>

    <div
      v-if="shownStatus || !collapsed"
      :class="[CELL_CLASS, 'text-sm text-ink-gray-5']"
    >
      <span
        v-if="collapsed"
        :class="totalHoursClass({ theme: totalHoursTheme })"
      >
        {{ totalHours }}
      </span>
      <span v-else>Total</span>
    </div>

    <div :class="ACTION_CELL_CLASS">
      <StatusActionButton
        v-if="shownStatus && submitLabel"
        :status="shownStatus"
        :label="submitLabel"
        :solid-icon="SOLID_ACTION_ICON[shownStatus]"
        :icon-class="actionIconClass"
        @press="emit('submit')"
      />
      <ApprovalStatus v-else-if="shownStatus" :status="shownStatus" />
    </div>
  </div>
</template>
