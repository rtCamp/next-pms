<script setup lang="ts">
import { computed } from "vue";
import { Avatar } from "frappe-ui";
import { RichText } from "@/components/RichText";
import { formatRelativeTimeShort } from "@/utils/text";
import NoteActions from "./NoteActions.vue";
import type { Note } from "./types";
import { useNotes } from "./useNotes";

const props = defineProps<{ note: Note }>();

const { openNote } = useNotes();

const created = computed(() =>
  formatRelativeTimeShort(props.note.creation, new Date(), true),
);

function onKeydown(event: KeyboardEvent) {
  if (event.target !== event.currentTarget) return;
  event.preventDefault();
  openNote(props.note.name);
}
</script>

<template>
  <!-- eslint-disable better-tailwindcss/no-restricted-classes -- React's 526px max width is past the spacing scale -->
  <div
    role="button"
    tabindex="0"
    class="flex h-64 min-w-66 max-w-[526px] flex-1 cursor-pointer flex-col overflow-clip rounded-6 border border-outline-gray-2 bg-surface-base shadow-xl"
    @click="openNote(note.name)"
    @keydown.enter.space="onKeydown"
  >
    <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
    <div class="flex items-center justify-between gap-2 px-3.5 pt-3.5">
      <h3 class="flex-1 truncate text-lg-medium text-ink-gray-8">
        {{ note.title }}
      </h3>
      <NoteActions :note="note" />
    </div>
    <div class="relative flex-1 overflow-hidden">
      <RichText
        :content="note.description"
        kit="richText"
        class="prose-sm px-3.5 leading-normal text-ink-gray-5"
      />
      <span
        class="pointer-events-none absolute bottom-0 left-0 z-10 block h-12 w-full bg-gradient-to-t from-surface-base to-transparent"
      />
    </div>
    <div class="flex items-center gap-2 px-3.5 pb-3.5 pt-3">
      <a
        :href="`/desk/user/${encodeURIComponent(note.owner)}`"
        class="flex shrink-0 items-center"
        :aria-label="note.ownerName || note.owner"
        @click.stop
      >
        <Avatar
          size="xs"
          :label="note.ownerName"
          :image="note.ownerImage ?? undefined"
        />
      </a>
      <span class="flex-1 truncate text-sm text-ink-gray-5">
        {{ note.ownerName }}
      </span>
      <span class="shrink-0 text-base text-ink-gray-5">{{ created }}</span>
    </div>
  </div>
</template>
