<script setup lang="ts">
import { computed } from "vue";
import { Spinner } from "frappe-ui";
import { APPROVAL_STATUS_ICONS } from "./icons";
import type { ApprovalStatusProps } from "./types";

const props = defineProps<ApprovalStatusProps>();

const look = computed(
  () =>
    APPROVAL_STATUS_ICONS[props.status] ??
    APPROVAL_STATUS_ICONS["Not Submitted"],
);
</script>

<template>
  <span
    role="img"
    :aria-label="status"
    :title="status"
    class="inline-flex size-4 shrink-0 items-center justify-center"
    :class="look.color"
  >
    <Spinner v-if="look.icon === null" class="size-4" aria-hidden="true" />
    <span v-else class="size-4" :class="look.icon" aria-hidden="true" />
  </span>
</template>
