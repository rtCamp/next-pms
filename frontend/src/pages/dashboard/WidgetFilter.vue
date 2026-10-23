<script setup lang="ts">
import { computed } from "vue";
import { MultiSelect, type MultiSelectOption } from "frappe-ui";
import { filterSummary } from "./filterSummary";

const props = defineProps<{
  /** Singular name of what's filtered, e.g. `"role"`. */
  noun: string;
  options: MultiSelectOption[];
}>();

const selected = defineModel<string[]>({ required: true });

const summary = computed(() =>
  filterSummary(props.noun, selected.value.length, props.options.length),
);
</script>

<template>
  <div class="w-44 shrink-0">
    <MultiSelect
      v-model="selected"
      :options="options"
      class="w-full"
      align="end"
    >
      <template #summary>{{ summary }}</template>
    </MultiSelect>
  </div>
</template>
