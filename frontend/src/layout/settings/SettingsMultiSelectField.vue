<script setup lang="ts">
import { computed, ref } from "vue";
import { MultiSelect } from "frappe-ui";
import { useDoctypeLinkLookup } from "@/composables/useDoctypeLinkLookup";

const props = defineProps<{
  label: string;
  /** The linked doctype, e.g. `"Role"`. */
  doctype: string;
}>();

const model = defineModel<string[]>({ required: true });

const query = ref("");
const lookup = useDoctypeLinkLookup({
  doctype: props.doctype,
  query,
});

// The picked values stay listed while a search shows other results.
const options = computed(() => {
  const picked = model.value.map((value) => ({ label: value, value }));
  const found = lookup.options.filter(
    (option) => !model.value.includes(String(option.value)),
  );
  return [...picked, ...found];
});

const value = computed({
  get: () => model.value,
  set: (next: (string | number)[]) => {
    model.value = next.map(String);
  },
});
</script>

<template>
  <MultiSelect
    v-model="value"
    v-model:query="query"
    :label="label"
    :options="options"
    :loading="lookup.loading"
    :filterable="false"
    :placeholder="`Select ${label}`"
  />
</template>
