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
  <div class="max-w-sm pt-10">
    <TextInput
      v-model="shownWeeks"
      type="number"
      min="0"
      step="1"
      label="Default Expanded Weeks in Timesheet View"
      aria-describedby="expanded-weeks-help"
      :disabled="useSystem"
    />
    <Checkbox v-model="useSystem" class="mt-4" label="Use system default" />
    <p id="expanded-weeks-help" class="mt-2 text-p-sm text-ink-gray-6">
      Number of recent weeks expanded by default.
    </p>
  </div>
</template>
