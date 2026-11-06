<script setup lang="ts">
import { computed, ref, useId } from "vue";
import { FormLabel, MultiSelect } from "frappe-ui";
import { InfoHoverCard, type FieldHelp } from "@/components/InfoHoverCard";
import { useDoctypeLinkLookup } from "@/composables/useDoctypeLinkLookup";

const props = defineProps<{
  label: string;
  /** The linked doctype, e.g. `"Role"`. */
  doctype: string;
  help?: FieldHelp;
}>();

const id = useId();

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
  <div class="space-y-1.5">
    <div class="flex min-w-0 items-center gap-1.5">
      <FormLabel :id="id" :label="label" />
      <InfoHoverCard v-if="help" :help="help" />
    </div>
    <MultiSelect
      :id="id"
      v-model="value"
      v-model:query="query"
      class="w-full"
      :options="options"
      :loading="lookup.loading"
      :filterable="false"
      :placeholder="`Select ${label}`"
    />
  </div>
</template>
