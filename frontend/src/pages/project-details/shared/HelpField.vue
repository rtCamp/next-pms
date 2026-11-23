<script setup lang="ts">
import { useId } from "vue";
import { FormLabel } from "frappe-ui";
import { InfoHoverCard, type FieldHelp } from "@/components/InfoHoverCard";

defineProps<{
  label: string;
  /** The hover card beside the label. */
  help?: FieldHelp;
  required?: boolean;
}>();

defineSlots<{
  /** The control; give it `id` so the label names it. */
  default: (props: { id: string }) => unknown;
}>();

const id = useId();
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex items-center gap-1.5">
      <FormLabel :id="id" :label="label" :required="required" />
      <InfoHoverCard v-if="help" :help="help" />
    </div>
    <slot :id="id" />
  </div>
</template>
