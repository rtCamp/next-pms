<script setup lang="ts">
import { ref } from "vue";
import { Button } from "frappe-ui";
import { useSession } from "@/session";
import { errorMessage } from "@/utils/errors";
import StatusMessage from "./StatusMessage.vue";

const emit = defineEmits<{ loaded: [] }>();

const session = useSession();
const retrying = ref(false);

async function retry() {
  retrying.value = true;
  try {
    await session.load();
  } finally {
    retrying.value = false;
  }
  if (!session.error) emit("loaded");
}
</script>

<template>
  <StatusMessage
    icon="lucide-cloud-off"
    title="Couldn't load your account"
    :description="errorMessage(session.error)"
  >
    <Button
      variant="solid"
      icon-left="lucide-refresh-cw"
      label="Retry"
      :loading="retrying"
      @click="retry"
    />
    <Button
      icon-left="lucide-log-out"
      label="Log out"
      @click="session.logout()"
    />
  </StatusMessage>
</template>
