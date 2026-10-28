<script setup lang="ts">
import PriorityPill from "@/pages/project-details/shared/PriorityPill.vue";

defineProps<{ level?: string | null; bare?: boolean }>();
</script>

<template>
  <PriorityPill
    v-if="level"
    :level="level"
    :label="`${level} risk`"
    :bare="bare"
  />
</template>
