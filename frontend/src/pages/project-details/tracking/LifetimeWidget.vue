<script setup lang="ts">
import { computed } from "vue";
import type { FieldHelp } from "@/components/InfoHoverCard";
import KnowledgePoint from "./KnowledgePoint.vue";
import type { Tracking } from "./types";
import { useTracking } from "./useTracking";

const props = defineProps<{
  title: string;
  field: keyof NonNullable<Tracking["lifetime_values"]>;
  help?: FieldHelp;
}>();

const { tracking, money } = useTracking();

const value = computed(() => {
  const amount = tracking.value?.lifetime_values?.[props.field];
  return amount == null ? "N/A" : money(amount);
});
</script>

<template>
  <KnowledgePoint :title="title" :value="value" :help="help" />
</template>
