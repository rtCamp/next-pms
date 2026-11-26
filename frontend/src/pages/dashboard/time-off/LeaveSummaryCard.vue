<script setup lang="ts">
import { computed } from "vue";
import { Avatar } from "frappe-ui";
import {
  leaveDateRange,
  leaveDayType,
  leaveDuration,
  type EmployeeOnLeave,
} from "./leaves";

const props = defineProps<{ leave: EmployeeOnLeave }>();

const reason = computed(() => props.leave.description?.trim());
</script>

<template>
  <div
    class="flex flex-col gap-3 rounded-6 border border-outline-gray-1 bg-surface-gray-1 p-3"
  >
    <div class="flex items-center gap-3">
      <Avatar
        size="lg"
        shape="circle"
        :image="leave.user_image ?? undefined"
        :label="leave.employee_name"
      />
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <span class="truncate text-base-medium text-ink-gray-8">
          {{ leave.employee_name }}
        </span>
        <span class="truncate text-sm text-ink-gray-6">
          {{ leave.leave_type }} · {{ leaveDayType(leave) }}
        </span>
      </div>
      <div class="flex shrink-0 flex-col items-end gap-0.5 text-right">
        <span class="text-base text-ink-gray-8">
          {{ leaveDateRange(leave) }}
        </span>
        <span class="text-sm text-ink-gray-6">
          {{ leaveDuration(leave.total_leave_days) }}
        </span>
      </div>
    </div>
    <div
      v-if="reason"
      class="flex flex-col gap-0.5 border-t border-outline-gray-1 pt-3"
    >
      <span class="text-sm text-ink-gray-6">Reason</span>
      <p class="whitespace-pre-line text-base text-ink-gray-8">{{ reason }}</p>
    </div>
  </div>
</template>
