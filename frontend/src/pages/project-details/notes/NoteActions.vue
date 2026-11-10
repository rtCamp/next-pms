<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { Button, Dropdown, Tooltip } from "frappe-ui";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { useSession } from "@/session";
import TooltipMenuLabel from "@/pages/project-details/shared/TooltipMenuLabel.vue";
import { NOTE_EDITOR_ROUTES } from "./constants";
import { DELETE_NOTE_TOOLTIP, PIN_TOOLTIP, UNPIN_TOOLTIP } from "./help";
import { exportNote } from "./notes";
import type { Note } from "./types";
import { useNotes } from "./useNotes";

const props = defineProps<{ note: Note }>();

const router = useRouter();
const session = useSession();
const { projectId } = useProjectDetails();
const { updating, togglePin, requestDelete } = useNotes();

const isAuthor = computed(() => props.note.owner === session.userId);

const options = computed(() => [
  {
    label: "Edit",
    icon: "lucide-pencil",
    disabled: updating.value,
    onClick: () =>
      router.push({
        name: NOTE_EDITOR_ROUTES.edit,
        params: { projectId: projectId.value, noteId: props.note.name },
      }),
  },
  {
    label: props.note.pinned ? "Unpin" : "Pin",
    icon: props.note.pinned ? "lucide-pin-off" : "lucide-pin",
    disabled: updating.value,
    slot: "tooltip",
    tooltip: PIN_TOOLTIP,
    onClick: () => togglePin(props.note),
  },
  {
    label: "Export",
    icon: "lucide-download",
    onClick: () => exportNote(props.note),
  },
  // The backend lets only the author (or Administrator) delete; React disables it for anyone else.
  {
    label: "Delete",
    icon: "lucide-trash-2",
    theme: "red" as const,
    disabled: updating.value || !isAuthor.value,
    slot: isAuthor.value ? undefined : "tooltip",
    tooltip: DELETE_NOTE_TOOLTIP(props.note.ownerName || props.note.owner),
    onClick: () => requestDelete(props.note),
  },
]);
</script>

<template>
  <span class="flex items-center" @click.stop @keydown.stop>
    <Tooltip v-if="note.pinned" :text="UNPIN_TOOLTIP">
      <Button
        variant="ghost"
        icon="lucide-pin-off"
        label="Unpin note"
        :disabled="updating"
        @click="togglePin(note)"
      />
    </Tooltip>
    <Dropdown :options="options" align="end">
      <Button variant="ghost" icon="lucide-ellipsis" label="Note actions" />
      <template #item-tooltip="{ item }">
        <TooltipMenuLabel
          :label="item.label"
          :tooltip="item.tooltip"
          :disabled="item.disabled"
          :theme="item.theme"
        />
      </template>
    </Dropdown>
  </span>
</template>
