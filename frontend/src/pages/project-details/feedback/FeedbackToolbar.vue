<script setup lang="ts">
import { computed } from "vue";
import { Button, Dropdown } from "frappe-ui";
import {
  FEEDBACK_VIEWS,
  SCHEDULE_FEEDBACK_URL,
  type FeedbackView,
} from "./constants";

const view = defineModel<FeedbackView>({ required: true });

const label = computed(
  () => FEEDBACK_VIEWS.find((option) => option.value === view.value)?.label,
);
const options = FEEDBACK_VIEWS.map((option) => ({
  label: option.label,
  onClick: () => (view.value = option.value),
}));
</script>

<template>
  <div class="mb-3.5 flex items-center justify-between">
    <Dropdown :options="options" side="bottom" align="start">
      <Button
        variant="ghost"
        icon-right="lucide-chevron-down"
        :aria-label="`View: ${label}`"
      >
        <span class="text-2xl-semibold text-ink-gray-7">{{ label }}</span>
      </Button>
    </Dropdown>
    <Button
      variant="solid"
      label="Schedule Feedback"
      :href="SCHEDULE_FEEDBACK_URL"
    />
  </div>
</template>
