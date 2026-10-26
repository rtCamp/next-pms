<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Avatar, Button, Combobox } from "frappe-ui";
import { useEmployeeLookup } from "@/composables/useEmployeeLookup";
import type { LookupOption } from "@/composables/useRemoteLookup";
import { toEmployeeUserOptions } from "@/pages/project-details/shared/permissions";
import type { Person } from "@/pages/project-details/shared/types";
import { errorMessage } from "@/utils/errors";

const props = defineProps<{
  label: string;
  placeholder: string;
  /** Searches only while the dialog is open. */
  enabled: boolean;
}>();

/** The owner's user ID, `""` for none. */
const model = defineModel<string>({ required: true });

const query = ref("");
/** The owner shown when the search results don't include them; as React, a saved owner is labelled by their user ID. */
const current = ref<Person | null>(null);

watch(
  [model, () => props.enabled],
  ([userId]) => {
    if (userId !== current.value?.userId)
      current.value = userId ? { userId, label: userId } : null;
  },
  { immediate: true },
);

const lookup = useEmployeeLookup({
  enabled: () => props.enabled,
  // In input mode the combobox puts the selected label in the query; not a search.
  query: () => (query.value === current.value?.label ? "" : query.value),
});
const options = computed(() =>
  toEmployeeUserOptions(lookup.options, current.value),
);
const searchError = computed(() =>
  lookup.error ? errorMessage(lookup.error) : null,
);

const value = computed({
  get: () => model.value || null,
  set: (next) => {
    const option = options.value.find((item) => item.value === next);
    current.value = option
      ? {
          userId: String(option.value),
          label: option.label,
          image: option.image,
        }
      : null;
    model.value = next ? String(next) : "";
  },
});

function personOf(option: unknown) {
  return option as LookupOption;
}
</script>

<template>
  <Combobox
    v-model="value"
    v-model:query="query"
    :label="label"
    size="md"
    variant="outline"
    :options="options"
    :loading="lookup.loading"
    :filterable="false"
    open-on-focus
    :placeholder="placeholder"
  >
    <template #item-prefix="{ item }">
      <Avatar
        size="xs"
        shape="circle"
        :image="personOf(item).image"
        :label="personOf(item).label"
      />
    </template>
    <template v-if="value" #suffix="{ clear }">
      <Button
        class="size-4 shrink-0"
        variant="ghost"
        size="xs"
        icon="lucide-x"
        :label="`Clear ${label.toLowerCase()}`"
        @click.stop="clear()"
      />
    </template>
    <template v-if="searchError && !options.length" #empty>
      <span role="alert" class="text-ink-red-6">{{ searchError }}</span>
    </template>
    <template v-else-if="searchError" #footer>
      <p role="alert" class="px-3 py-1.5 text-base text-ink-red-6">
        {{ searchError }}
      </p>
    </template>
  </Combobox>
</template>
