<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { Button, Dropdown } from "frappe-ui";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { useSession } from "@/session";
import { NOTE_EDITOR_ROUTES } from "./constants";
import { exportNote } from "./notes";
import type { Note } from "./types";
import { useNotes } from "./useNotes";

const props = defineProps<{ note: Note }>();

const router = useRouter();
const session = useSession();
const { projectId } = useProjectDetails();
const { updating, togglePin, requestDelete } = useNotes();

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
    onClick: () => togglePin(props.note),
  },
  {
    label: "Export",
    icon: "lucide-download",
    onClick: () => exportNote(props.note),
  },
  // The backend lets only the author (or Administrator) delete; React shows it to the author.
  ...(props.note.owner === session.userId
    ? [
        {
          label: "Delete",
          icon: "lucide-trash-2",
          theme: "red" as const,
          disabled: updating.value,
          onClick: () => requestDelete(props.note),
        },
      ]
    : []),
]);
</script>

<template>
  <span class="flex items-center" @click.stop @keydown.stop>
    <Button
      v-if="note.pinned"
      variant="ghost"
      icon="lucide-pin-off"
      label="Unpin note"
      :disabled="updating"
      @click="togglePin(note)"
    />
    <Dropdown :options="options" align="end">
      <Button variant="ghost" icon="lucide-ellipsis" label="Note actions" />
    </Dropdown>
  </span>
</template>
