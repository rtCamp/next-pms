<script setup lang="ts">
import { computed } from "vue";
import { Avatar, Button, Combobox } from "frappe-ui";
import type { LookupOption } from "@/composables/useRemoteLookup";

defineProps<{ placeholder: string; options: LookupOption[] }>();

const model = defineModel<string>({ required: true });

const value = computed({
  get: () => model.value || null,
  set: (next) => (model.value = next ? String(next) : ""),
});

function personOf(option: unknown) {
  return option as LookupOption;
}
</script>

<template>
  <Combobox
    v-model="value"
    class="w-44 text-ink-gray-7"
    :options="options"
    :placeholder="placeholder"
    :aria-label="placeholder"
    open-on-focus
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
        :label="`Clear ${placeholder.toLowerCase()}`"
        @click.stop="clear()"
      />
    </template>
  </Combobox>
</template>
