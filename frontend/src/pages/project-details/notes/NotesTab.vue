<script setup lang="ts">
import { Spinner } from "frappe-ui";
import LoadError from "@/pages/project-details/LoadError.vue";
import NoteCard from "./NoteCard.vue";
import NoteDetail from "./NoteDetail.vue";
import NotesHeader from "./NotesHeader.vue";
import { provideNotes } from "./useNotes";

const { notes, noteId, loading, loadError, refresh } = provideNotes();
</script>

<template>
  <NoteDetail v-if="noteId" :key="noteId" />
  <div v-else class="flex flex-col gap-3.5">
    <NotesHeader />
    <LoadError
      v-if="loadError"
      title="Couldn't load the notes"
      :error="loadError"
      @retry="refresh()"
    />
    <div
      v-else
      class="relative min-h-40"
      :class="loading && 'opacity-50 transition-opacity duration-150'"
    >
      <p
        v-if="!loading && !notes.length"
        class="py-10 text-center text-sm text-ink-gray-4"
      >
        No notes found
      </p>
      <div v-else-if="notes.length" class="flex flex-wrap gap-5">
        <NoteCard v-for="note in notes" :key="note.name" :note="note" />
      </div>
      <div
        v-if="loading"
        class="absolute inset-0 z-10 flex cursor-wait items-center justify-center"
      >
        <Spinner class="size-5" />
      </div>
    </div>
  </div>
</template>
