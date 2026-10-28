<script setup lang="ts">
import PriorityPill from "@/pages/project-details/shared/PriorityPill.vue";
import { isPriorityLevel } from "@/pages/project-details/shared/priority";

defineProps<{ priority?: string | null }>();
</script>

<template>
  <PriorityPill
    v-if="isPriorityLevel(priority)"
    class="min-w-0"
    :level="priority"
    :label="priority"
  />
  <span v-else>—</span>
</template>
