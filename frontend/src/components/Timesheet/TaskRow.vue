<script setup lang="ts">
import { ref, watch } from "vue";
import { HoverCard } from "frappe-ui";
import { TaskStatus } from "@/components/TaskStatus";
import { FilledStarIcon } from "@/icons";
import TimeCell from "./TimeCell.vue";
import {
  ACTION_CELL_CLASS,
  BUTTON_CELL_CLASS,
  CELL_CLASS,
  ROW_CLASS,
  TIME_ENTRY_STATUS_CLASS,
} from "./constants";
import type { TaskRowProps, TaskRowTimeEntry } from "./types";

const props = withDefaults(defineProps<TaskRowProps>(), {
  status: "Open",
  starred: false,
  hideStarButton: false,
  totalHours: "",
  guard: (action: () => void) => action(),
});

const emit = defineEmits<{
  /** A day's cell was pressed while it accepts time; `date` is the cell's `date`. */
  cellClick: [dayIndex: number, date: string | undefined];
  /** The star button was pressed. */
  star: [];
  /** The task's name was pressed. */
  labelClick: [];
}>();

defineSlots<{
  /** Card shown when hovering the task's name. */
  card?: () => unknown;
  /**
   * Popover for a day's entries, opened by hovering or pressing its cell.
   * Call `setEngaged(true)` once the user starts editing: the popover then
   * stays open until they close it, and closing goes through `guard`.
   */
  entry?: (props: {
    dayIndex: number;
    /** The cell's `date`. */
    date: string | undefined;
    close: () => void;
    setEngaged: (engaged: boolean) => void;
  }) => unknown;
}>();

const openDay = ref<number | null>(null);
const engaged = ref(false);

function canOpen(entry: TaskRowTimeEntry) {
  return !(entry.disabled && entry.time === "");
}

function close() {
  engaged.value = false;
  openDay.value = null;
}

function setEngaged(value: boolean) {
  engaged.value = value;
}

function requestClose() {
  props.guard(close);
}

function onOpenChange(dayIndex: number, open: boolean) {
  if (open) {
    if (canOpen(props.timeEntries[dayIndex])) openDay.value = dayIndex;
    return;
  }
  // While the user edits, hover and focus changes leave the popover open;
  // the backdrop, Escape or the cell close it through the guard.
  if (!engaged.value && openDay.value === dayIndex) openDay.value = null;
}

function onCellClick(dayIndex: number) {
  const entry = props.timeEntries[dayIndex];
  if (engaged.value && openDay.value === dayIndex) requestClose();
  else if (canOpen(entry)) openDay.value = dayIndex;
  if (!entry.disabled) emit("cellClick", dayIndex, entry.date);
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") requestClose();
}

watch(engaged, (isEngaged, _, onCleanup) => {
  if (!isEngaged) return;
  document.addEventListener("keydown", onKeydown);
  onCleanup(() => document.removeEventListener("keydown", onKeydown));
});

function cellClass(entry: TaskRowTimeEntry) {
  return [
    "text-base",
    (entry.status && TIME_ENTRY_STATUS_CLASS[entry.status]) ??
      (entry.disabled ? "text-ink-gray-5" : "text-ink-gray-8"),
  ];
}
</script>

<template>
  <div :class="ROW_CLASS">
    <div class="group flex min-w-0 flex-1 items-center">
      <div class="flex min-w-0 items-center gap-2">
        <TaskStatus :status="status" />
        <HoverCard v-if="$slots.card" side="bottom" align="start" :offset="8">
          <template #trigger>
            <button
              type="button"
              class="min-w-0 max-w-75 truncate text-left text-base-medium text-ink-gray-8 sm:max-w-112"
              @click="emit('labelClick')"
            >
              {{ label }}
            </button>
          </template>
          <slot name="card" />
        </HoverCard>
        <button
          v-else
          type="button"
          class="min-w-0 max-w-75 truncate text-left text-base-medium text-ink-gray-8 sm:max-w-112"
          @click="emit('labelClick')"
        >
          {{ label }}
        </button>
        <button
          v-if="!hideStarButton"
          type="button"
          class="flex size-4 shrink-0 items-center justify-center rounded-4"
          :class="
            !starred &&
            'opacity-0 transition-opacity duration-100 focus-within:opacity-100 group-hover:opacity-100'
          "
          :aria-label="starred ? 'Unstar task' : 'Star task'"
          :aria-pressed="starred"
          @click="emit('star')"
        >
          <FilledStarIcon
            v-if="starred"
            class="size-4 text-ink-amber-5"
            aria-hidden="true"
          />
          <span
            v-else
            class="lucide-star size-4 text-ink-gray-4"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>

    <div
      v-for="(entry, index) in timeEntries"
      :key="index"
      :class="BUTTON_CELL_CLASS"
    >
      <HoverCard
        v-if="$slots.entry"
        :open="openDay === index"
        side="bottom"
        align="end"
        :offset="8"
        :hover-delay="250"
        :leave-delay="220"
        @update:open="onOpenChange(index, $event)"
      >
        <template #trigger>
          <TimeCell
            :time="entry.time"
            :locked="entry.disabled"
            :non-billable="entry.nonBillable"
            :class="cellClass(entry)"
            @click="onCellClick(index)"
          />
        </template>
        <slot
          name="entry"
          :day-index="index"
          :date="entry.date"
          :close="close"
          :set-engaged="setEngaged"
        />
      </HoverCard>
      <TimeCell
        v-else
        :time="entry.time"
        :locked="entry.disabled"
        :non-billable="entry.nonBillable"
        :class="cellClass(entry)"
        @click="onCellClick(index)"
      />
    </div>

    <div
      :class="[
        CELL_CLASS,
        'text-base text-ink-gray-6 lining-nums tabular-nums',
      ]"
    >
      {{ totalHours }}
    </div>

    <div :class="ACTION_CELL_CLASS" />

    <Teleport to="body">
      <div
        v-if="engaged"
        class="fixed inset-0 z-50"
        aria-hidden="true"
        @click="requestClose"
      />
    </Teleport>
  </div>
</template>
