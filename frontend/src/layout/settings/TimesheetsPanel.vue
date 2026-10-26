<script setup lang="ts">
import { computed } from "vue";
import { Checkbox, TextInput } from "frappe-ui";

const props = defineProps<{
  /** The system default, shown while the user follows it. */
  systemWeeks?: number;
}>();

/** The user's own number of expanded weeks; `""` for none. */
const weeks = defineModel<string>("weeks", { required: true });
const useSystem = defineModel<boolean>("useSystem", { required: true });

const shownWeeks = computed({
  get: () => (useSystem.value ? String(props.systemWeeks ?? "") : weeks.value),
  set: (value: string | number) => {
    weeks.value = String(value);
  },
});
</script>

<template>
  <div class="flex max-w-sm flex-col gap-4">
    <TextInput
      v-model="shownWeeks"
      type="number"
      min="0"
      step="1"
      label="Default Expanded Weeks in Timesheet View"
      description="Number of recent weeks expanded by default."
      :disabled="useSystem"
    />
    <Checkbox v-model="useSystem" label="Use system default" />
  </div>
</template>
