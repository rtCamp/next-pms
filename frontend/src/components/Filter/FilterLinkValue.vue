<script setup lang="ts">
import { computed, ref } from "vue";
import { Combobox } from "frappe-ui";
import { useDoctypeLinkLookup } from "@/composables/useDoctypeLinkLookup";
import type { FilterLinkValueRenderProps } from "./types";

const props = defineProps<FilterLinkValueRenderProps>();

const selected = computed(() =>
  props.value
    ? { label: props.displayLabel || props.value, value: props.value }
    : null,
);
const query = ref("");
const lookup = useDoctypeLinkLookup({
  doctype: props.field.link?.doctype ?? "",
  labelField: props.field.link?.labelField,
  valueField: props.field.link?.valueField,
  filters: props.field.link?.filters,
  customMethod: props.field.link?.customMethod,
  enabled: () => Boolean(props.field.link?.doctype),
  // In input mode the combobox puts the selected option's label in the query; that's
  // not a search, so it's left out.
  query: () => (query.value === selected.value?.label ? "" : query.value),
  selected,
});

function onChange(next: string | number | null | undefined) {
  const value = next == null || next === "" ? null : String(next);
  const label = lookup.options.find((option) => option.value === value)?.label;
  props.setValue(value, label);
}
</script>

<template>
  <Combobox
    v-model:query="query"
    class="w-50"
    aria-label="Value"
    placeholder="Value"
    :model-value="value"
    :options="lookup.options"
    :loading="lookup.loading"
    :filterable="false"
    :disabled="disabled"
    @update:model-value="onChange"
  />
</template>
