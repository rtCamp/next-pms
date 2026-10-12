<script setup lang="ts">
import { Button } from "frappe-ui";
import { useSession } from "../session";
import StatusMessage from "../layout/StatusMessage.vue";

const session = useSession();
</script>

<template>
  <StatusMessage
    icon="lucide-user-x"
    title="Access restricted"
    description="Next PMS needs an Employee record linked to your user. Ask your HR team to link one."
  >
    <Button icon-left="lucide-arrow-left-right" label="Open Desk" href="/app" />
    <Button
      icon-left="lucide-log-out"
      label="Log out"
      @click="session.logout()"
    />
  </StatusMessage>
</template>
