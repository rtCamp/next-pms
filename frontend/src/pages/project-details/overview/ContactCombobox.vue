<script setup lang="ts">
import { useCustomerContactLookup } from "@/pages/project-details/useCustomerContactLookup";
import LinkCombobox, { type LinkLookupInputs } from "./LinkCombobox.vue";
import { useOverview } from "./useOverview";

defineProps<{ label: string; disabled?: boolean }>();
const model = defineModel<string>({ required: true });

const { customer, contactLabel } = useOverview();

const contactLookup = ({ query, selected }: LinkLookupInputs) =>
  useCustomerContactLookup({ customer, enabled: true, query, selected });
</script>

<template>
  <LinkCombobox
    v-model="model"
    :label="label"
    placeholder="Select contact"
    :selected-label="model ? contactLabel(model) : ''"
    :create-lookup="contactLookup"
    :disabled="disabled || !customer"
  />
</template>
