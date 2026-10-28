<script setup lang="ts">
import { Dialog } from "frappe-ui";
import TeamFeedbackDetail from "./TeamFeedbackDetail.vue";

defineProps<{ feedbackId: string | null }>();
const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <Dialog v-model:open="open" title="Detailed feedback" size="4xl">
    <TeamFeedbackDetail
      v-if="feedbackId"
      :key="feedbackId"
      :feedback-id="feedbackId"
    />
  </Dialog>
</template>
