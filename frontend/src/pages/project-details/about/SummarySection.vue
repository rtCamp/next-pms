<script setup lang="ts">
import { useProjectSidebar } from "./useProjectSidebar";

const { sidebar } = useProjectSidebar();
</script>

<template>
  <p v-if="sidebar?.summary" class="text-base leading-normal text-ink-gray-7">
    {{ sidebar.summary }}
  </p>
</template>
