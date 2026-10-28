<script setup lang="ts">
import { computed } from "vue";
import { Avatar, dayjs, Tooltip } from "frappe-ui";
import GanttCardDetail from "./GanttCardDetail.vue";
import GanttOpenLink from "./GanttOpenLink.vue";
import {
  allocationSummaryText,
  employeeHref,
  projectHref,
  type CardEntry,
} from "./rows";
import { useGanttGrid } from "./useGanttGrid";

const props = defineProps<{
  entry: CardEntry;
}>();

const emit = defineEmits<{
  edit: [];
  delete: [];
}>();

const grid = useGanttGrid();
const bar = computed(() => props.entry.bar);
const text = computed(() => allocationSummaryText(bar.value));
const billable = computed(() => bar.value.billable ?? true);
const canManage = computed(() =>
  bar.value.isAiCreated
    ? grid.canManageAiAllocations.value
    : grid.hasRoleAccess.value,
);
const employeeLink = computed(() =>
  grid.hasRoleAccess.value && bar.value.employeeId
    ? employeeHref(bar.value.employeeId)
    : undefined,
);
const projectLink = computed(() =>
  grid.hasRoleAccess.value && bar.value.projectId
    ? projectHref(bar.value.projectId)
    : undefined,
);

const formatDay = (date: Date) => dayjs(date).format("MMM D");
const history = computed(() => {
  const { createdOn, updatedOn } = bar.value;
  if (bar.value.isAiCreated) {
    return createdOn ? `Ai created on ${formatDay(createdOn)}` : "Ai created";
  }
  if (updatedOn && createdOn && updatedOn.getTime() !== createdOn.getTime()) {
    return `Last edited on ${formatDay(updatedOn)}`;
  }
  return createdOn ? `Created on ${formatDay(createdOn)}` : "";
});
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      v-if="grid.variant.value === 'project'"
      class="flex min-w-0 items-center gap-2"
    >
      <Avatar
        class="shrink-0"
        size="xs"
        shape="circle"
        :image="entry.employeeImage"
        :label="entry.employeeName"
      />
      <span class="min-w-0 flex-1 truncate text-base-medium text-ink-gray-7">
        {{ entry.employeeName }}
      </span>
      <GanttOpenLink
        v-if="employeeLink"
        :href="employeeLink"
        label="Open employee"
      />
    </div>
    <div v-else class="flex items-start gap-2">
      <span
        class="lucide-folder mt-px size-4 shrink-0 text-ink-gray-7"
        aria-hidden="true"
      />
      <span class="min-w-0 flex-1 truncate text-base-medium text-ink-gray-7">
        {{ bar.projectName }}
      </span>
      <GanttOpenLink
        v-if="projectLink"
        :href="projectLink"
        label="Open project"
      />
    </div>

    <div class="relative flex flex-col gap-2.5">
      <GanttCardDetail icon="lucide-calendar">
        {{ text.dateRange }}
      </GanttCardDetail>
      <GanttCardDetail icon="lucide-clock" :tooltip="grid.hoursTooltip.value">
        {{ text.hoursPerDay }} ({{ text.totalHours }})
      </GanttCardDetail>
      <div class="flex items-center gap-2">
        <span
          class="size-4 shrink-0 text-ink-gray-6"
          :class="bar.tentative ? 'lucide-circle-dashed' : 'lucide-check'"
          aria-hidden="true"
        />
        <span class="text-sm text-ink-gray-6">
          {{ bar.tentative ? "Tentative" : "Confirmed" }}
        </span>
        <span
          class="scale-150 leading-none"
          :class="billable ? 'text-ink-green-8' : 'text-ink-amber-6'"
          aria-hidden="true"
        >
          ·
        </span>
        <span class="text-sm text-ink-gray-6">
          {{ billable ? "Billable" : "Non-billable" }}
        </span>
      </div>

      <div class="flex items-center justify-between gap-2">
        <div v-if="history" class="flex flex-1 items-center gap-2">
          <Tooltip
            v-if="!bar.isAiCreated && bar.updatedBy"
            :text="bar.updatedBy.name"
          >
            <span class="flex shrink-0 items-center">
              <Avatar
                size="xs"
                shape="circle"
                :image="bar.updatedBy.image"
                :label="bar.updatedBy.name"
              />
            </span>
          </Tooltip>
          <span
            class="mr-10 truncate"
            :class="
              bar.isAiCreated
                ? 'text-sm-semibold text-ink-amber-8'
                : 'text-sm text-ink-gray-6'
            "
          >
            {{ history }}
          </span>
        </div>
        <div v-if="canManage" class="flex shrink-0 items-center gap-2">
          <button
            type="button"
            class="rounded-1 text-ink-gray-6 transition-colors hover:text-ink-gray-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
            aria-label="Edit allocation"
            @click="emit('edit')"
          >
            <span class="lucide-pencil block size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="rounded-1 text-ink-gray-6 transition-colors hover:text-ink-gray-7 focus:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
            aria-label="Delete allocation"
            @click="emit('delete')"
          >
            <span class="lucide-trash-2 block size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
