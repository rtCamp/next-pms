<script setup lang="ts">
import { computed, ref } from "vue";
import { Button, Combobox } from "frappe-ui";
import { useDoctypeLinkLookup } from "@/composables/useDoctypeLinkLookup";

const props = defineProps<{
  label: string;
  /** The linked doctype, e.g. `"Email Template"`. */
  doctype: string;
  clearable?: boolean;
}>();

const model = defineModel<string | null | undefined>({ required: true });

const query = ref("");
const lookup = useDoctypeLinkLookup({
  doctype: props.doctype,
  // In input mode the combobox puts the selected label in the query; not a search.
  query: () => (query.value === model.value ? "" : query.value),
  selected: () =>
    model.value ? { label: model.value, value: model.value } : null,
});

const value = computed({
  get: () => model.value || null,
  set: (next) => {
    model.value = next ? String(next) : null;
  },
});
</script>

<template>
  <Combobox
    v-model="value"
    v-model:query="query"
    :label="label"
    size="md"
    variant="outline"
    :options="lookup.options"
    :loading="lookup.loading"
    :filterable="false"
    open-on-focus
    :placeholder="`Select ${label}`"
  >
    <template v-if="clearable && value" #suffix="{ clear }">
      <Button
        class="size-4 shrink-0"
        variant="ghost"
        size="xs"
        icon="lucide-x"
        :label="`Clear ${label.toLowerCase()}`"
        @click.stop="clear()"
      />
    </template>
  </Combobox>
</template>
