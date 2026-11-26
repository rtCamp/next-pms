<script setup lang="ts">
import { computed } from "vue";
import { Avatar, Dialog, Select, Spinner } from "frappe-ui";
import { InfoHoverCard } from "@/components/InfoHoverCard";
import { TaskBadges } from "@/components/TaskBadges";
import { TaskProgress } from "@/components/TaskProgress";
import { TaskStatus } from "@/components/TaskStatus";
import { floatToTime } from "@/utils/format";
import { DEFAULT_TASK_LOG_RANGE, TASK_LOG_RANGE_OPTIONS } from "./constants";
import { TASK_LOG_HELP } from "./help";
import TaskLogEntryItem from "./TaskLogEntryItem.vue";
import type { TaskLogProps } from "./types";

const props = withDefaults(defineProps<TaskLogProps>(), {
  view: "personal",
  details: null,
  entries: () => [],
  loading: false,
});
const open = defineModel<boolean>("open", { required: true });
/** Days counted back from today. */
const range = defineModel<number>("range", { default: DEFAULT_TASK_LOG_RANGE });

const isTeam = computed(() => props.view === "team");

const progress = computed(() => {
  const details = props.details;
  if (!details?.estimatedHours) return 0;
  return Math.round((details.actualHours / details.estimatedHours) * 100);
});

// The personal view's summary is the viewer's own row; the server returns only
// workers with time in range, so it may be absent.
const ownSummary = computed(() => props.details?.workedBy[0] ?? null);

// Select's model is string | number | null; keep the range a number.
const rangeModel = computed({
  get: () => range.value,
  set: (value: string | number | null) => {
    if (value !== null && value !== "") range.value = Number(value);
  },
});
</script>

<template>
  <Dialog
    v-model:open="open"
    size="md"
    position="top"
    :padding-top="isTeam ? 16 : 88"
  >
    <template #title>
      <div v-if="details" class="flex items-center gap-x-2 gap-y-1.5 pr-2">
        <TaskStatus :status="details.status" />
        <h3 class="text-lg font-semibold text-ink-gray-8">
          <a
            v-if="details.ghLink"
            :href="details.ghLink"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-end gap-1"
          >
            {{ details.subject }}
            <span
              class="lucide-arrow-up-right size-4 shrink-0"
              aria-hidden="true"
            />
          </a>
          <template v-else>{{ details.subject }}</template>
        </h3>
      </div>
    </template>

    <div v-if="loading || !details" class="flex justify-center py-6">
      <Spinner class="size-6" />
    </div>
    <template v-else>
      <!-- Tucked up under the title, as React's -mt-[5%] did. -->
      <TaskBadges
        class="-mt-5.5 ml-6"
        :project-name="details.projectName"
        :due-date="details.dueDate"
      />

      <div class="mt-4 flex justify-between text-sm">
        <div class="flex items-center gap-1.5">
          <!-- eslint-disable-next-line better-tailwindcss/no-restricted-classes -- no scale step for 3px -->
          <div class="mb-0.5 flex gap-[3px]">
            <div class="flex gap-1">
              <span
                class="font-medium"
                :class="progress > 100 ? 'text-ink-red-8' : 'text-ink-gray-8'"
              >
                {{ floatToTime(details.actualHours) }}
              </span>
              <span class="text-ink-gray-5">Actual</span>
            </div>
            <span class="text-ink-gray-5">/</span>
            <div class="flex gap-1">
              <span class="text-ink-gray-7">
                {{ floatToTime(details.estimatedHours) }}
              </span>
              <span class="text-ink-gray-5">Est.</span>
            </div>
          </div>
          <InfoHoverCard :help="TASK_LOG_HELP.progress" />
        </div>
        <div class="text-ink-gray-6">{{ progress }}%</div>
      </div>
      <TaskProgress
        :value="progress"
        size="sm"
        label="Actual against estimated time"
        class="mt-2.5"
      />

      <div class="mt-6 flex items-center justify-between">
        <h4 v-if="isTeam" class="text-base font-medium text-ink-gray-8">
          Time entries
        </h4>
        <div
          v-else-if="ownSummary"
          class="flex items-center justify-between gap-1 rounded-4 bg-surface-gray-2 px-2 py-1.5 text-ink-gray-7"
        >
          <Avatar
            size="xs"
            :label="ownSummary.employeeName"
            :image="ownSummary.image ?? undefined"
          />
          <span class="text-base">
            {{ floatToTime(ownSummary.totalHours) }}
          </span>
        </div>
        <Select
          v-model="rangeModel"
          :options="TASK_LOG_RANGE_OPTIONS"
          :variant="isTeam ? 'ghost' : 'subtle'"
          aria-label="Date range"
          class="w-auto text-ink-gray-7"
          :class="!isTeam && 'text-sm'"
        />
      </div>

      <!-- eslint-disable better-tailwindcss/no-restricted-classes -- Tailwind 3 has no mask-image or scrollbar-width utilities -->
      <ul
        v-if="isTeam && details.workedBy.length"
        aria-label="Time by member"
        class="mt-2 flex items-center justify-start gap-1.5 overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)] [scrollbar-width:none]"
      >
        <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
        <li
          v-for="worker in details.workedBy"
          :key="worker.employeeId"
          class="flex shrink-0 items-start justify-between gap-2 rounded-4 border border-outline-elevation-2 px-2 py-1.5"
        >
          <Avatar
            size="xs"
            :label="worker.employeeName"
            :image="worker.image ?? undefined"
          />
          <div>
            <p class="mb-1 text-sm font-medium text-ink-gray-7">
              {{ worker.employeeName }}
            </p>
            <p class="text-xs text-ink-gray-5">
              {{ floatToTime(worker.totalHours) }}
            </p>
          </div>
        </li>
      </ul>

      <!-- eslint-disable better-tailwindcss/no-restricted-classes -- Tailwind 3 has no scrollbar-width utility -->
      <ul
        v-if="entries.length"
        aria-label="Time entries"
        class="-mr-3 mt-3 flex max-h-54 flex-col gap-3 overflow-y-auto pr-3 [scrollbar-width:thin]"
        :class="{ 'mt-4': isTeam }"
      >
        <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
        <TaskLogEntryItem
          v-for="(entry, index) in entries"
          :key="`${index}-${entry.date}`"
          :entry="entry"
          :show-avatar="isTeam"
        />
      </ul>
      <p v-else class="mt-3 text-center text-base text-ink-gray-5">
        No time logs found for the selected date range.
      </p>
    </template>
  </Dialog>
</template>
