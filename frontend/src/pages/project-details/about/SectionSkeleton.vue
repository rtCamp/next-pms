<script setup lang="ts">
import { Skeleton } from "frappe-ui";

defineProps<{ lines: number }>();
</script>

<template>
  <div class="flex flex-col gap-3" aria-busy="true">
    <Skeleton
      v-for="line in lines"
      :key="line"
      :class="line === lines && lines > 1 ? 'h-4 w-2/3' : 'h-4 w-full'"
    />
  </div>
</template>
