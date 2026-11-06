<script setup lang="ts">
import { computed, ref } from "vue";
import { Badge, Checkbox, dayjs, Spinner } from "frappe-ui";
import type { CalendarEvent, SelectedCalendarEvent } from "./types";
import { toSelectedEvents, totalEventHours } from "./utils";

const props = withDefaults(
  defineProps<{
    /** Whether Google Calendar is connected; the checkbox is off without it. */
    setup: boolean;
    events?: CalendarEvent[];
    loading?: boolean;
    error?: boolean;
  }>(),
  { events: () => [], loading: false, error: false },
);

/** Whether the event list is shown ("Add calendar events"). */
const show = defineModel<boolean>("show", { default: false });

const emit = defineEmits<{
  /** The picked events' list items and their total length in hours. */
  selectionChange: [items: SelectedCalendarEvent[], totalHours: number];
}>();

const selectedIds = ref<string[]>([]);

const selectAll = computed(
  () =>
    props.events.length > 0 &&
    props.events.every((event) => selectedIds.value.includes(event.id)),
);

function select(ids: string[]) {
  selectedIds.value = ids;
  const picked = props.events.filter((event) => ids.includes(event.id));
  emit("selectionChange", toSelectedEvents(picked), totalEventHours(picked));
}

function toggleShow(value: boolean) {
  show.value = value;
  if (!value) select([]);
}

function toggleAll(checked: boolean) {
  select(checked ? props.events.map((event) => event.id) : []);
}

function toggleEvent(id: string, checked: boolean) {
  select(
    checked
      ? [...selectedIds.value, id]
      : selectedIds.value.filter((selected) => selected !== id),
  );
}

function eventTime(event: CalendarEvent) {
  return `${dayjs(event.starts_on).format("h:mm A")} - ${dayjs(event.ends_on).format("h:mm A")}`;
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-1">
      <Checkbox
        :model-value="show"
        label="Add calendar events"
        :disabled="!setup"
        @update:model-value="toggleShow(Boolean($event))"
      />
      <a
        v-if="!setup"
        href="/desk/google-calendar"
        target="_blank"
        class="px-2 text-base text-ink-gray-7"
      >
        Enable
      </a>
    </div>

    <div v-if="show" class="rounded-4 border border-outline-gray-2 px-2.5 py-2">
      <div v-if="loading" class="flex justify-center py-2">
        <Spinner class="size-4" />
      </div>
      <p v-else-if="error" class="py-2 text-center text-base text-ink-gray-5">
        Failed to load calendar events.
      </p>
      <p
        v-else-if="events.length === 0"
        class="py-2 text-center text-base text-ink-gray-5"
      >
        No events found for the selected date.
      </p>
      <template v-else>
        <div
          class="mb-2.5 flex justify-between border-b border-outline-gray-1 pb-2.5 text-base text-ink-gray-5"
        >
          <Checkbox
            :model-value="selectAll"
            label="Select all"
            @update:model-value="toggleAll(Boolean($event))"
          />
          <span>{{ selectedIds.length }} of {{ events.length }}</span>
        </div>
        <ul class="flex max-h-40 flex-col gap-3 overflow-y-auto">
          <li v-for="event in events" :key="event.id">
            <Checkbox
              :model-value="selectedIds.includes(event.id)"
              :label="event.subject"
              @update:model-value="toggleEvent(event.id, Boolean($event))"
            />
            <div class="ml-5 flex gap-1">
              <Badge :label="dayjs(event.starts_on).format('MMM D')">
                <template #prefix>
                  <span
                    class="lucide-calendar-clock size-3 text-ink-gray-6"
                    aria-hidden="true"
                  />
                </template>
              </Badge>
              <Badge :label="eventTime(event)">
                <template #prefix>
                  <span
                    class="lucide-clock size-3 text-ink-gray-6"
                    aria-hidden="true"
                  />
                </template>
              </Badge>
            </div>
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>
