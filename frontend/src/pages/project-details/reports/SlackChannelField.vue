<script setup lang="ts">
import { computed, ref } from "vue";
import { Button, Combobox, FormLabel, toast } from "frappe-ui";
import { useRemoteLookup } from "@/composables/useRemoteLookup";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { errorMessage } from "@/utils/errors";

const { doc, setValue } = useProjectDetails();

const slackChannel = computed(() => doc.value?.custom_slack_channel_slug ?? "");
const editing = ref(false);
const draft = ref("");
const draftLabel = ref("");
const query = ref("");
const saving = ref(false);

const current = computed(() =>
  editing.value ? draft.value : slackChannel.value,
);

interface SlackChannel {
  name: string;
  channel_name: string;
}

const lookup = useRemoteLookup<SlackChannel[] | null, SlackChannel>({
  method: "frappe.client.get_list",
  enabled: editing,
  // In input mode the combobox puts the selected label in the query; not a search.
  query: () => (query.value === draftLabel.value ? "" : query.value),
  selected: () =>
    current.value ? { label: current.value, value: current.value } : null,
  params: (search) => ({
    doctype: "Slack Channel",
    fields: JSON.stringify(["name", "channel_name"]),
    limit_page_length: 20,
    start: 0,
    or_filters: search
      ? JSON.stringify([
          ["Slack Channel", "name", "like", `%${search}%`],
          ["Slack Channel", "channel_name", "like", `%${search}%`],
        ])
      : undefined,
  }),
  getItems: (response) => response ?? [],
  toOption: (channel) => ({ label: channel.channel_name, value: channel.name }),
});

function startEditing() {
  draft.value = slackChannel.value;
  draftLabel.value = slackChannel.value;
  query.value = "";
  editing.value = true;
}

function cancelEditing() {
  query.value = "";
  editing.value = false;
}

function select(value: string | number | null | undefined) {
  draft.value = value ? String(value) : "";
  draftLabel.value =
    lookup.options.find((option) => option.value === draft.value)?.label ??
    draft.value;
}

async function save() {
  saving.value = true;
  try {
    await setValue({ custom_slack_channel_slug: draft.value });
    toast.success("Slack channel updated");
    editing.value = false;
  } catch (error) {
    toast.error(errorMessage(error));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <FormLabel id="slack-channel" label="Slack Channel" />
    <div class="flex items-center gap-2">
      <Combobox
        id="slack-channel"
        v-model:query="query"
        class="flex-1"
        :model-value="current || null"
        :options="lookup.options"
        :loading="lookup.loading"
        :filterable="false"
        :disabled="!editing || saving"
        :placeholder="editing ? 'Select channel' : 'Not set'"
        empty-text="No channels found"
        open-on-focus
        variant="outline"
        @update:model-value="select"
      />
      <template v-if="editing">
        <Button
          variant="ghost"
          icon="lucide-check"
          label="Save Slack channel"
          :loading="saving"
          @click="save"
        />
        <Button
          variant="ghost"
          icon="lucide-x"
          label="Cancel"
          :disabled="saving"
          @click="cancelEditing"
        />
      </template>
      <Button
        v-else
        variant="ghost"
        icon="lucide-pencil"
        label="Edit Slack channel"
        @click="startEditing"
      />
    </div>
  </div>
</template>
