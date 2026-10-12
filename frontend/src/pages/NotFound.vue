<script setup lang="ts">
import { Button } from "frappe-ui";
import StatusMessage from "@/layout/StatusMessage.vue";
</script>

<template>
  <StatusMessage
    icon="lucide-map-pin-off"
    title="Page not found"
    description="There's nothing at this address."
  >
    <Button icon-left="lucide-house" label="Go home" route="/" />
  </StatusMessage>
</template>
