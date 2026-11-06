<script setup lang="ts">
import RiskStatusDot from "./RiskStatusDot.vue";

defineProps<{ status?: string | null }>();
</script>

<template>
  <span v-if="!status">—</span>
  <span v-else class="flex min-w-0 items-center gap-2">
    <RiskStatusDot :status="status" />
    <span class="truncate">{{ status }}</span>
  </span>
</template>
