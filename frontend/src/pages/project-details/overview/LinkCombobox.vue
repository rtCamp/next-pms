<script setup lang="ts">
import { computed, ref } from "vue";
import { Combobox } from "frappe-ui";
import type { LookupOption } from "@/composables/useRemoteLookup";
import { errorMessage } from "@/utils/errors";

export interface LinkLookup {
  options: LookupOption[];
  loading: boolean;
  error: unknown;
}

export interface LinkLookupInputs {
  query: () => string;
  selected: () => LookupOption | null;
}

const props = defineProps<{
  /** The field's accessible name. */
  label: string;
  placeholder: string;
  /**
   * Creates the lookup, run once in setup. It searches while the field shows,
   * which is only in edit mode, as React.
   */
  createLookup: (inputs: LinkLookupInputs) => LinkLookup;
  /** The selected value's label. Default: the value. */
  selectedLabel?: string;
  disabled?: boolean;
}>();

const model = defineModel<string>({ required: true });

const query = ref("");
const selectedLabel = computed(() => props.selectedLabel ?? model.value);

const lookup = props.createLookup({
  // In input mode the combobox puts the selected label in the query; not a search.
  query: () => (query.value === selectedLabel.value ? "" : query.value),
  selected: () =>
    model.value ? { label: selectedLabel.value, value: model.value } : null,
});

const searchError = computed(() =>
  lookup.error ? errorMessage(lookup.error) : null,
);

const value = computed({
  get: () => model.value || null,
  set: (next) => (model.value = next ? String(next) : ""),
});
</script>

<template>
  <Combobox
    v-model="value"
    v-model:query="query"
    :options="lookup.options"
    :loading="lookup.loading"
    :filterable="false"
    :disabled="disabled"
    :placeholder="placeholder"
    :aria-label="label"
    open-on-focus
  >
    <!-- The selected value is always an option, so the list may not be empty. -->
    <template v-if="searchError && !lookup.options.length" #empty>
      <span role="alert" class="text-ink-red-6">{{ searchError }}</span>
    </template>
    <template v-else-if="searchError" #footer>
      <p role="alert" class="px-3 py-1.5 text-base text-ink-red-6">
        {{ searchError }}
      </p>
    </template>
  </Combobox>
</template>
