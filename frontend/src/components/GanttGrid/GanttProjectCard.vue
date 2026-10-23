<script setup lang="ts">
import { computed } from "vue";
import GanttCardDetail from "./GanttCardDetail.vue";
import GanttOpenLink from "./GanttOpenLink.vue";
import { projectHref } from "./rows";
import { formatHours } from "./summary";
import type { GanttProject } from "./types";

const props = defineProps<{
  project: Omit<GanttProject, "allocations">;
  /** Shows the link to the project's page. */
  canOpen: boolean;
}>();

const href = computed(() =>
  props.canOpen && props.project.id ? projectHref(props.project.id) : undefined,
);
const dateRange = computed(
  () => props.project.projectDateRange ?? props.project.dateRange,
);
const remaining = computed(() =>
  props.project.remainingHours === undefined
    ? undefined
    : `${formatHours(props.project.remainingHours)}h remaining`,
);
const hasDetails = computed(() =>
  Boolean(
    props.project.customer ||
    dateRange.value ||
    remaining.value ||
    props.project.projectManager,
  ),
);
</script>

<template>
  <div class="flex w-72 flex-col gap-3 p-3">
    <div class="flex items-start gap-3" :class="href && 'justify-between'">
      <div class="flex min-w-0 items-center gap-2">
        <span
          class="lucide-folder size-4 shrink-0 text-ink-gray-8"
          aria-hidden="true"
        />
        <span class="truncate text-base-medium text-ink-gray-7">
          {{ project.name }}
        </span>
      </div>
      <GanttOpenLink v-if="href" :href="href" label="Open project" />
    </div>
    <template v-if="hasDetails">
      <div class="h-px w-full shrink-0 bg-surface-gray-3" />
      <div class="flex flex-col gap-2.5">
        <GanttCardDetail v-if="project.customer" icon="lucide-users">
          {{ project.customer }}
        </GanttCardDetail>
        <GanttCardDetail v-if="dateRange" icon="lucide-calendar">
          {{ dateRange }}
        </GanttCardDetail>
        <GanttCardDetail v-if="remaining" icon="lucide-clock">
          {{ remaining }}
        </GanttCardDetail>
        <GanttCardDetail v-if="project.projectManager" icon="lucide-user">
          {{ project.projectManager }}
        </GanttCardDetail>
      </div>
    </template>
  </div>
</template>
