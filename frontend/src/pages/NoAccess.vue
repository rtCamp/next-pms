<script setup lang="ts">
import { Button } from "frappe-ui";
import StatusMessage from "../layout/StatusMessage.vue";
</script>

<template>
  <StatusMessage
    icon="lucide-lock"
    title="No access"
    description="You don't have a role that can open this page. Ask your administrator if you need it."
  >
    <Button icon-left="lucide-house" label="Go home" route="/" />
  </StatusMessage>
</template>
