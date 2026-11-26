<script setup lang="ts">
import { computed } from "vue";
import { Checkbox, FormLabel, TextInput } from "frappe-ui";
import { InfoHoverCard } from "@/components/InfoHoverCard";
import { SETTINGS_HELP } from "./help";

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
    <div class="space-y-1.5">
      <div class="flex min-w-0 items-center gap-1.5">
        <FormLabel
          id="expanded-weeks"
          label="Default Expanded Weeks in Timesheet View"
        />
        <InfoHoverCard :help="SETTINGS_HELP.expandedWeeks" />
      </div>
      <TextInput
        id="expanded-weeks"
        v-model="shownWeeks"
        type="number"
        min="0"
        step="1"
        aria-describedby="expanded-weeks-help"
        :disabled="useSystem"
      />
    </div>
    <Checkbox v-model="useSystem" class="mt-4" label="Use system default" />
    <p id="expanded-weeks-help" class="mt-2 text-p-sm text-ink-gray-6">
      Number of recent weeks expanded by default.
    </p>
  </div>
</template>
