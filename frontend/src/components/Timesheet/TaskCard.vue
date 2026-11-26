<script setup lang="ts">
import { computed } from "vue";
import { TaskBadges } from "@/components/TaskBadges";
import { TaskProgress } from "@/components/TaskProgress";
import { TaskStatus } from "@/components/TaskStatus";
import { floatToTime } from "@/utils/format";
import type { TaskCardProps } from "./types";

const props = defineProps<TaskCardProps>();

const progress = computed(() =>
  props.estimatedHours === 0
    ? 0
    : Math.round((props.actualHours / props.estimatedHours) * 100),
);
</script>

<template>
  <div class="w-88 p-3">
    <div class="mb-6 flex gap-2">
      <TaskStatus :status="status" class="mt-0.5" />
      <div class="flex min-w-0 flex-col gap-1.5">
        <div class="break-words text-base-semibold text-ink-gray-8">
          {{ label }}
        </div>
        <TaskBadges :project-name="projectName" :due-date="dueDate" />
      </div>
    </div>
    <div class="flex justify-between text-base">
      <div class="mb-0.5 flex gap-1">
        <div class="flex gap-1">
          <span
            class="font-medium"
            :class="progress > 100 ? 'text-ink-red-8' : 'text-ink-gray-8'"
          >
            {{ floatToTime(actualHours) }}
          </span>
          <span class="text-ink-gray-5">Actual</span>
        </div>
        <span class="text-ink-gray-5">/</span>
        <div class="flex gap-1">
          <span class="font-medium text-ink-gray-8">
            {{ floatToTime(estimatedHours) }}
          </span>
          <span class="text-ink-gray-5">Est.</span>
        </div>
      </div>
      <div class="text-ink-gray-6">{{ progress }}%</div>
    </div>
    <TaskProgress
      :value="progress"
      label="Actual against estimated time"
      class="mt-2.5"
    />
  </div>
</template>
