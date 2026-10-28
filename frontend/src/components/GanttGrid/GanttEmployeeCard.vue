<script setup lang="ts">
import { computed } from "vue";
import { Avatar } from "frappe-ui";
import GanttCardDetail from "./GanttCardDetail.vue";
import GanttOpenLink from "./GanttOpenLink.vue";
import { employeeHref } from "./rows";
import type { GanttEmployee } from "./types";

const props = defineProps<{
  employee: Omit<GanttEmployee, "projects">;
  /** Shows the link to the employee's record. */
  canOpen: boolean;
  /** Tooltip on the hourly rate line. */
  rateTooltip?: string;
  /** Tooltip on the working hours line. */
  capacityTooltip?: string;
}>();

const href = computed(() =>
  props.canOpen && props.employee.id
    ? employeeHref(props.employee.id)
    : undefined,
);
const hasDetails = computed(() =>
  Boolean(
    props.employee.department ||
    props.employee.rate ||
    props.employee.capacity ||
    props.employee.manager,
  ),
);
</script>

<template>
  <div class="flex w-60 flex-col gap-3 p-3">
    <div class="flex items-start gap-2" :class="href && 'justify-between'">
      <div class="flex min-w-0 items-center gap-2">
        <Avatar
          class="shrink-0"
          size="xl"
          shape="circle"
          :image="employee.image"
          :label="employee.name"
        />
        <div class="flex min-w-0 flex-col gap-1">
          <span class="truncate text-base-medium text-ink-gray-7">
            {{ employee.name }}
          </span>
          <span
            v-if="employee.designation"
            class="truncate text-sm text-ink-gray-6"
          >
            {{ employee.designation }}
          </span>
        </div>
      </div>
      <GanttOpenLink v-if="href" :href="href" label="Open employee" />
    </div>
    <template v-if="hasDetails">
      <div class="h-px w-full shrink-0 bg-surface-gray-3" />
      <div class="flex flex-col gap-2.5">
        <GanttCardDetail v-if="employee.department" icon="lucide-users">
          {{ employee.department }}
        </GanttCardDetail>
        <GanttCardDetail
          v-if="employee.rate"
          icon="lucide-banknote"
          :tooltip="rateTooltip"
        >
          {{ employee.rate }}
        </GanttCardDetail>
        <GanttCardDetail
          v-if="employee.capacity"
          icon="lucide-clock"
          :tooltip="capacityTooltip"
        >
          {{ employee.capacity }}
        </GanttCardDetail>
        <GanttCardDetail v-if="employee.manager" icon="lucide-headset">
          {{ employee.manager }}
        </GanttCardDetail>
      </div>
    </template>
  </div>
</template>
