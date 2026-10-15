<script setup lang="ts">
import { computed, useId, type VNode } from "vue";
import {
  Button,
  Combobox,
  DatePicker,
  DateRangePicker,
  TextInput,
} from "frappe-ui";
import type { ComboboxOptionValue, DateRangeValue } from "frappe-ui";
import { operatorsFor } from "./operators";
import type {
  FilterCondition,
  FilterLinkValueRenderProps,
  FilterOptionType,
  FilterRowProps,
} from "./types";

const props = withDefaults(defineProps<FilterRowProps>(), { isFirst: false });

const emit = defineEmits<{
  change: [filter: FilterCondition];
  remove: [];
}>();

const slots = defineSlots<{
  "link-value"?: (props: FilterLinkValueRenderProps) => VNode[];
}>();

const dateInputId = useId();

const LINK_SET_OPTIONS: FilterOptionType[] = [
  { label: "Set", value: "is_set" },
  { label: "Not set", value: "is_not_set" },
];

const selectedField = computed(
  () => props.fields.find((f) => f.name === props.filter.field) ?? null,
);
const operators = computed(() => operatorsFor(selectedField.value));
const hideValue = computed(
  () =>
    operators.value.find((op) => op.value === props.filter.operator)
      ?.hideValue ?? false,
);

const fieldOptions = computed<FilterOptionType[]>(() =>
  props.fields.map((f) => ({ label: f.label, value: f.name, icon: f.icon })),
);
const operatorOptions = computed<FilterOptionType[]>(() =>
  operators.value.map((op) => ({ label: op.label, value: op.value })),
);
const valueOptions = computed(() => selectedField.value?.options ?? []);

const valueDisabled = computed(() => !props.filter.operator);
const stringValue = computed(() =>
  typeof props.filter.value === "string" ? props.filter.value : null,
);
const rangeValue = computed<DateRangeValue>(() =>
  Array.isArray(props.filter.value) && props.filter.value.length === 2
    ? [props.filter.value[0], props.filter.value[1]]
    : [],
);

const valueKind = computed(() => {
  const type = selectedField.value?.type;
  if (hideValue.value) return "none";
  if (type === "date") return "date";
  if (type === "daterange") return "daterange";
  if (type === "link" && props.filter.operator === "is") return "link-set";
  if (type === "link" && hasLinkSlot.value) return "link";
  if (valueOptions.value.length > 0) return "options";
  return "text";
});

const hasLinkSlot = computed(() => Boolean(slots["link-value"]));

function onFieldChange(value: ComboboxOptionValue | null | undefined) {
  if (value == null || value === "") return;
  const field = props.fields.find((f) => f.name === value);
  emit("change", {
    ...props.filter,
    field: String(value),
    operator: operatorsFor(field)[0]?.value ?? "is",
    value: null,
    displayLabel: undefined,
    fieldCategory: field?.fieldCategory,
  });
}

function onOperatorChange(value: ComboboxOptionValue | null | undefined) {
  if (value == null || value === "") return;
  const hides = operators.value.find((op) => op.value === value)?.hideValue;
  emit("change", {
    ...props.filter,
    operator: String(value),
    value: hides ? null : props.filter.value,
    displayLabel: hides ? undefined : props.filter.displayLabel,
  });
}

function setValue(
  value: string | string[] | null,
  displayLabel?: string | null,
) {
  emit("change", {
    ...props.filter,
    value,
    displayLabel: displayLabel ?? undefined,
  });
}

function onOptionValueChange(value: ComboboxOptionValue | null | undefined) {
  setValue(value == null || value === "" ? null : String(value));
}

function onTextChange(value: string | number | undefined) {
  setValue(value == null || value === "" ? null : String(value));
}

function onRangeChange(value: DateRangeValue) {
  setValue(value.length === 2 && (value[0] || value[1]) ? [...value] : null);
}
</script>

<template>
  <div class="flex items-center gap-2 py-1">
    <span class="w-12 shrink-0 px-2 py-1.5 text-base text-ink-gray-7">
      {{ isFirst ? "Where" : "And" }}
    </span>

    <Combobox
      class="min-w-30"
      aria-label="Field"
      placeholder="Field"
      :model-value="filter.field || null"
      :options="fieldOptions"
      @update:model-value="onFieldChange"
    />

    <Combobox
      class="min-w-20"
      aria-label="Operator"
      placeholder="Operator"
      :model-value="filter.operator || null"
      :options="operatorOptions"
      :disabled="!filter.field"
      @update:model-value="onOperatorChange"
    />

    <template v-if="valueKind === 'date'">
      <!-- eslint-disable-next-line vuejs-accessibility/label-has-for -- `for` reaches the picker's input through its `id` prop -->
      <label :for="dateInputId" class="sr-only">Value</label>
      <DatePicker
        :id="dateInputId"
        class="min-w-35"
        placeholder="Value"
        :model-value="stringValue ?? ''"
        :disabled="valueDisabled"
        @update:model-value="(v: string) => setValue(v || null)"
      />
    </template>
    <template v-else-if="valueKind === 'daterange'">
      <!-- eslint-disable-next-line vuejs-accessibility/label-has-for -- `for` reaches the picker's input through its `id` prop -->
      <label :for="dateInputId" class="sr-only">Value</label>
      <DateRangePicker
        :id="dateInputId"
        class="min-w-45"
        placeholder="Value"
        :model-value="rangeValue"
        :disabled="valueDisabled"
        @update:model-value="onRangeChange"
      />
    </template>
    <Combobox
      v-else-if="valueKind === 'link-set'"
      class="min-w-35"
      aria-label="Value"
      placeholder="Value"
      :model-value="stringValue"
      :options="LINK_SET_OPTIONS"
      :disabled="valueDisabled"
      @update:model-value="onOptionValueChange"
    />
    <slot
      v-else-if="valueKind === 'link' && selectedField"
      name="link-value"
      :field="selectedField"
      :value="stringValue"
      :displayLabel="filter.displayLabel"
      :setValue="setValue"
      :disabled="valueDisabled"
    />
    <Combobox
      v-else-if="valueKind === 'options'"
      class="min-w-35"
      aria-label="Value"
      placeholder="Value"
      :model-value="stringValue"
      :options="valueOptions"
      :disabled="valueDisabled"
      @update:model-value="onOptionValueChange"
    />
    <TextInput
      v-else-if="valueKind === 'text'"
      class="min-w-35"
      aria-label="Value"
      placeholder="Value"
      :type="selectedField?.type === 'number' ? 'number' : 'text'"
      :model-value="filter.value?.toString() ?? ''"
      :disabled="valueDisabled"
      @update:model-value="onTextChange"
    />

    <Button
      variant="ghost"
      class="group shrink-0"
      aria-label="Remove filter"
      @click="emit('remove')"
    >
      <template #icon>
        <span
          class="lucide-x size-4 text-ink-gray-7 group-hover:text-ink-gray-6"
          aria-hidden="true"
        />
      </template>
    </Button>
  </div>
</template>
