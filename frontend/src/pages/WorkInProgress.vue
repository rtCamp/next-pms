<script setup lang="ts">
import { useRoute } from "vue-router";
import StatusMessage from "@/layout/StatusMessage.vue";

const route = useRoute();
</script>

<template>
  <StatusMessage
    icon="lucide-hammer"
    :title="route.meta.title ?? 'This page'"
    description="This page is being rebuilt and will be back soon."
  />
</template>
