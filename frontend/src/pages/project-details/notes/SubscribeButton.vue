<script setup lang="ts">
import { computed } from "vue";
import { Button, toast, Tooltip, useCall } from "frappe-ui";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { errorMessage } from "@/utils/errors";
import { NOTES_API } from "./constants";
import type { NoteSubscription } from "./types";

const { projectId } = useProjectDetails();

const subscription = useCall<NoteSubscription, { project: string }>({
  url: `${NOTES_API}.get_project_update_subscription`,
  params: () => ({ project: projectId.value }),
});
const setSubscription = useCall<
  NoteSubscription,
  { project: string; subscribed: number }
>({
  url: `${NOTES_API}.set_project_update_subscription`,
  method: "POST",
  immediate: false,
});

const state = computed(() => setSubscription.data ?? subscription.data);

async function toggle() {
  const subscribed = state.value?.subscribed;
  try {
    await setSubscription.submit({
      project: projectId.value,
      subscribed: subscribed ? 0 : 1,
    });
  } catch (error) {
    toast.error(errorMessage(error));
    return;
  }
  toast.success(
    subscribed
      ? "Unsubscribed from project notes"
      : "Subscribed to project notes",
  );
}
</script>

<template>
  <template v-if="state && !subscription.loading">
    <Tooltip
      v-if="state.is_account_manager"
      text="Account managers are notified of every note"
    >
      <span>
        <Button icon-left="lucide-bell" label="Subscribed" disabled />
      </span>
    </Tooltip>
    <Button
      v-else
      :icon-left="state.subscribed ? 'lucide-bell-off' : 'lucide-bell'"
      :label="state.subscribed ? 'Unsubscribe' : 'Subscribe'"
      :loading="setSubscription.loading"
      @click="toggle"
    />
  </template>
</template>
