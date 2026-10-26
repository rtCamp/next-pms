<script setup lang="ts">
import { computed } from "vue";
import { Avatar, Button, Spinner } from "frappe-ui";
import { formatRelativeTimeShort } from "@/utils/text";
import NoteActions from "./NoteActions.vue";
import NoteBody from "./NoteBody.vue";
import NoteComments from "./NoteComments.vue";
import { useNotes } from "./useNotes";

const { notes, noteId, initialLoading, closeNote } = useNotes();

// As React: the note comes from the loaded list, not its own request.
const note = computed(
  () => notes.value.find((item) => item.name === noteId.value) ?? null,
);

const lastUpdated = computed(() =>
  note.value
    ? formatRelativeTimeShort(
        note.value.last_edited_at ?? note.value.modified,
        new Date(),
        true,
      )
    : "",
);
</script>

<template>
  <div v-if="initialLoading && !note" class="flex justify-center py-10">
    <Spinner class="size-5" />
  </div>
  <p v-else-if="!note" class="py-10 text-center text-sm text-ink-gray-4">
    Note not found
  </p>
  <div v-else class="w-full">
    <div class="flex items-center justify-between gap-8">
      <div class="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          icon="lucide-arrow-left"
          label="Back to notes"
          @click="closeNote()"
        />
        <a
          :href="`/desk/user/${encodeURIComponent(note.owner)}`"
          class="flex shrink-0 items-center"
          :aria-label="note.ownerName || note.owner"
        >
          <Avatar
            size="xs"
            :label="note.ownerName"
            :image="note.ownerImage ?? undefined"
          />
        </a>
        <span class="truncate text-base-medium text-ink-gray-7">
          {{ note.ownerName }}
        </span>
        <span class="shrink-0 text-ink-gray-5" aria-hidden="true">·</span>
        <span class="shrink-0 text-base text-ink-gray-5">
          last updated {{ lastUpdated }}
        </span>
      </div>
      <NoteActions :note="note" />
    </div>
    <NoteBody :key="note.name" :note="note" />
    <NoteComments :note-id="note.name" />
  </div>
</template>
