<script setup lang="ts">
import { computed } from "vue";
import { MultiSelect } from "frappe-ui";
import type { ApprovalStatusValue } from "@/components/ApprovalStatus";
import { APPROVAL_STATUS_BADGE } from "@/components/Timesheet";
import { APPROVAL_FILTER_STATUSES } from "./constants";

const selected = defineModel<ApprovalStatusValue[]>({ default: () => [] });

const OPTIONS = APPROVAL_FILTER_STATUSES.map((status) => ({
  label: APPROVAL_STATUS_BADGE[status].label,
  value: status,
}));

const model = computed({
  get: () => selected.value,
  set: (value: (string | number)[]) =>
    (selected.value = value as ApprovalStatusValue[]),
});
</script>

<template>
  <MultiSelect
    v-model="model"
    class="w-fit max-w-42"
    :options="OPTIONS"
    placeholder="Approval status"
    aria-label="Approval status"
  />
</template>
