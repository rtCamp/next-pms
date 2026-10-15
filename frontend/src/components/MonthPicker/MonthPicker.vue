<script setup lang="ts">
import { computed, ref } from "vue";
import { Button, Popover, dayjs } from "frappe-ui";
import type { MonthPickerProps } from "./types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<MonthPickerProps>(), {
  placeholder: "Select month",
  icon: "lucide-calendar",
  side: "bottom",
  align: "start",
});

const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const selected = computed(() => {
  const parsed = dayjs(props.modelValue ?? "", "MMMM YYYY", true);
  return parsed.isValid()
    ? { month: parsed.format("MMMM"), year: parsed.year() }
    : null;
});

const view = ref<"month" | "year">("month");
const year = ref(selected.value?.year ?? new Date().getFullYear());

const yearRangeStart = computed(() => year.value - (year.value % 12));
const years = computed(() =>
  Array.from({ length: 12 }, (_, i) => yearRangeStart.value + i),
);
const step = computed(() => (view.value === "year" ? 12 : 1));
const viewLabel = computed(() =>
  view.value === "month"
    ? String(year.value)
    : `${yearRangeStart.value} - ${yearRangeStart.value + 11}`,
);

function onOpen() {
  view.value = "month";
  if (selected.value) year.value = selected.value.year;
}

function toggleView() {
  view.value = view.value === "month" ? "year" : "month";
}

function isSelectedMonth(month: string) {
  return selected.value?.month === month && selected.value.year === year.value;
}

function selectMonth(month: string) {
  emit("update:modelValue", `${month} ${year.value}`);
}

function selectYear(value: number) {
  year.value = value;
  view.value = "month";
  emit("update:modelValue", `${selected.value?.month ?? "January"} ${value}`);
}
</script>

<template>
  <Popover :side="side" :align="align" @open="onOpen">
    <template #trigger>
      <Button v-bind="$attrs" class="w-full justify-between" :icon-right="icon">
        <span :class="{ 'text-ink-gray-5': !modelValue }">
          {{ modelValue || placeholder }}
        </span>
      </Button>
    </template>

    <div class="p-2" :class="{ 'min-w-52': view === 'year' }">
      <div class="flex justify-between gap-2">
        <Button
          variant="ghost"
          :aria-label="view === 'month' ? 'Previous year' : 'Previous years'"
          @click="year -= step"
        >
          <template #icon>
            <span
              class="lucide-chevron-left size-4 text-ink-gray-5"
              aria-hidden="true"
            />
          </template>
        </Button>
        <Button
          :aria-label="`${viewLabel}, choose ${view === 'month' ? 'year' : 'month'}`"
          @click="toggleView"
        >
          {{ viewLabel }}
        </Button>
        <Button
          variant="ghost"
          :aria-label="view === 'month' ? 'Next year' : 'Next years'"
          @click="year += step"
        >
          <template #icon>
            <span
              class="lucide-chevron-right size-4 text-ink-gray-5"
              aria-hidden="true"
            />
          </template>
        </Button>
      </div>

      <hr class="my-2 border-outline-gray-1" />

      <div class="grid grid-cols-3 gap-3">
        <template v-if="view === 'month'">
          <Button
            v-for="month in MONTHS"
            :key="month"
            :variant="isSelectedMonth(month) ? 'solid' : 'ghost'"
            :aria-pressed="isSelectedMonth(month)"
            @click="selectMonth(month)"
          >
            <span class="text-sm">{{ month.slice(0, 3) }}</span>
          </Button>
        </template>
        <template v-else>
          <Button
            v-for="value in years"
            :key="value"
            :variant="selected?.year === value ? 'solid' : 'ghost'"
            :aria-pressed="selected?.year === value"
            @click="selectYear(value)"
          >
            <span class="text-sm">{{ value }}</span>
          </Button>
        </template>
      </div>
    </div>
  </Popover>
</template>
