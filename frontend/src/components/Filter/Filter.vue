<script setup lang="ts">
import { computed, ref, type VNode } from "vue";
import { Button, Popover } from "frappe-ui";
import FilterRow from "./FilterRow.vue";
import type {
  FilterCondition,
  FilterLinkValueRenderProps,
  FilterProps,
} from "./types";

const props = withDefaults(defineProps<FilterProps>(), {
  modelValue: () => [],
  open: undefined,
  defaultOpen: false,
  maxFilters: 10,
  showCount: true,
  side: "bottom",
  align: "center",
  externalFilterCount: 0,
});

const emit = defineEmits<{
  "update:modelValue": [filters: FilterCondition[]];
  "update:open": [open: boolean];
  /** Fired by "Clear all", after `update:modelValue` with `[]`; reset external filters here. */
  clearAll: [];
}>();

defineSlots<{
  /** Value input for `type: "link"` fields; without it they get a free-text input. */
  "link-value"?: (props: FilterLinkValueRenderProps) => VNode[];
}>();

const localOpen = ref(props.defaultOpen);
const isOpen = computed({
  get: () => props.open ?? localOpen.value,
  set: (value: boolean) => {
    localOpen.value = value;
    emit("update:open", value);
  },
});

let idCounter = 0;
const generateId = () => `filter-${++idCounter}-${Date.now()}`;

const filterCount = computed(() => {
  const external = props.externalFilterCount;
  return (
    props.modelValue.length +
    (Number.isFinite(external) && external > 0 ? external : 0)
  );
});
const hasFilters = computed(() => filterCount.value > 0);
const canAdd = computed(() => props.modelValue.length < props.maxFilters);

function addFilter() {
  if (!canAdd.value) return;
  const first = props.fields[0];
  emit("update:modelValue", [
    ...props.modelValue,
    {
      id: generateId(),
      field: first?.name ?? "",
      operator: "",
      value: null,
      fieldCategory: first?.fieldCategory,
    },
  ]);
}

function updateFilter(index: number, filter: FilterCondition) {
  const next = [...props.modelValue];
  next[index] = filter;
  emit("update:modelValue", next);
}

function removeFilter(index: number) {
  const next = props.modelValue.filter((_, i) => i !== index);
  emit("update:modelValue", next);
  if (next.length === 0) isOpen.value = false;
}

function clearAll() {
  emit("update:modelValue", []);
  isOpen.value = false;
  emit("clearAll");
}

function onOpenChange(open: boolean) {
  isOpen.value = open;
  if (open && props.modelValue.length === 0) addFilter();
}
</script>

<template>
  <div class="inline-flex items-center">
    <Popover
      :open="isOpen"
      :side="side"
      :align="align"
      :auto-focus="false"
      @update:open="onOpenChange"
    >
      <template #trigger>
        <Button
          :class="[{ 'rounded-r-none border-r-0': hasFilters }, triggerClass]"
        >
          <template #prefix>
            <span
              class="lucide-list-filter size-4 text-ink-gray-7"
              aria-hidden="true"
            />
          </template>
          <template v-if="!hasFilters" #suffix>
            <span
              class="lucide-chevron-down size-4 text-ink-gray-5"
              aria-hidden="true"
            />
          </template>
          Filter
          <span
            v-if="showCount && hasFilters"
            class="ml-2 rounded-1 bg-surface-base px-1.5 py-0.5 text-xs shadow-sm"
          >
            {{ filterCount }}
          </span>
        </Button>
      </template>

      <div class="min-w-100 max-w-[600px] p-1">
        <div class="space-y-1">
          <FilterRow
            v-for="(filter, index) in modelValue"
            :key="filter.id"
            :filter="filter"
            :fields="fields"
            :is-first="index === 0"
            @change="updateFilter(index, $event)"
            @remove="removeFilter(index)"
          >
            <template v-if="$slots['link-value']" #link-value="slotProps">
              <slot name="link-value" v-bind="slotProps" />
            </template>
          </FilterRow>
        </div>

        <Button
          v-if="canAdd"
          variant="ghost"
          class="group mt-2"
          @click="addFilter"
        >
          <template #prefix>
            <span
              class="lucide-plus size-4 text-ink-gray-5 group-hover:text-ink-gray-7"
              aria-hidden="true"
            />
          </template>
          <span class="text-ink-gray-5 group-hover:text-ink-gray-7">
            Add filter
          </span>
        </Button>
      </div>
    </Popover>

    <Button
      v-if="hasFilters"
      icon="lucide-x"
      class="rounded-l-none border-l border-l-outline-gray-2"
      aria-label="Clear all filters"
      @click.stop="clearAll"
    />
  </div>
</template>
