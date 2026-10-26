<script setup lang="ts">
import { computed } from "vue";
import {
  Button,
  DatePicker,
  dayjs,
  Select,
  TabButtons,
  TextInput,
} from "frappe-ui";
import { dateKey } from "./calendar";
import { CALENDAR_VIEWS, TYPE_FILTERS } from "./constants";
import type { CalendarView, TypeFilter } from "./types";
import { useTimeline } from "./useTimeline";

const timeline = useTimeline();
const { view, tab, searchInput, month, typeFilter } = timeline;

const isList = computed(() => view.value === "list");
const monthLabel = computed(() => dayjs(month.value).format("MMMM YYYY"));
const pickerValue = computed(() => dateKey(month.value));

const viewModel = computed({
  get: () => view.value,
  set: (value) => (view.value = value as CalendarView),
});
const filterModel = computed({
  get: () => typeFilter.value,
  set: (value) => {
    if (value) typeFilter.value = value as TypeFilter;
  },
});

function pick(value: string) {
  if (value) timeline.pickDate(value);
}
</script>

<template>
  <div class="flex w-full flex-wrap items-center justify-between gap-2">
    <div class="flex items-center">
      <TextInput
        v-if="isList"
        v-model="searchInput"
        class="w-56"
        size="sm"
        type="search"
        :placeholder="
          tab === 'milestones' ? 'Search milestone' : 'Search touchpoint'
        "
        :aria-label="
          tab === 'milestones' ? 'Search milestones' : 'Search touchpoints'
        "
      />
      <DatePicker
        v-else
        :model-value="pickerValue"
        :clearable="false"
        side="bottom"
        align="start"
        @update:model-value="pick"
      >
        <template #trigger="{ open, setOpen }">
          <Button
            variant="ghost"
            class="shrink-0"
            aria-haspopup="dialog"
            :aria-expanded="open"
            :aria-label="`Month: ${monthLabel}`"
            @click="setOpen(!open)"
          >
            <span class="mr-2 whitespace-nowrap text-lg-medium text-ink-gray-7">
              {{ monthLabel }}
            </span>
            <template #suffix>
              <span
                class="lucide-chevron-down size-4 shrink-0"
                aria-hidden="true"
              />
            </template>
          </Button>
        </template>
      </DatePicker>
    </div>
    <div class="flex items-center justify-end gap-2 max-md:contents">
      <div v-if="!isList" class="flex items-center py-0.5">
        <Button
          variant="ghost"
          icon="lucide-chevron-left"
          label="Previous month"
          @click="timeline.goToPrevious()"
        />
        <Button
          variant="ghost"
          class="text-ink-gray-7"
          label="Today"
          @click="timeline.goToToday()"
        />
        <Button
          variant="ghost"
          icon="lucide-chevron-right"
          label="Next month"
          @click="timeline.goToNext()"
        />
      </div>
      <div class="flex items-center gap-2 max-md:w-full max-md:justify-between">
        <TabButtons
          v-model="viewModel"
          :options="CALENDAR_VIEWS"
          aria-label="View"
        />
        <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -- aria-label reaches frappe-ui's trigger -->
        <Select
          v-if="!isList"
          v-model="filterModel"
          class="w-min"
          size="sm"
          variant="subtle"
          :options="TYPE_FILTERS"
          aria-label="Show"
        />
      </div>
    </div>
  </div>
</template>
