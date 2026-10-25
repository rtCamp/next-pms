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
</script>

<template>
  <!-- eslint-disable better-tailwindcss/no-restricted-classes -- React's 526px max width is past the spacing scale; ringColor has no ink scale -->
  <div
    class="relative flex h-64 min-w-66 max-w-[526px] flex-1 flex-col overflow-clip rounded-6 border border-outline-gray-2 bg-surface-base shadow-xl has-[h3>button:focus-visible]:ring-2 has-[h3>button:focus-visible]:ring-[--ink-gray-4]"
  >
    <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
    <div class="flex items-center justify-between gap-2 px-3.5 pt-3.5">
      <h3 class="min-w-0 flex-1 text-lg-medium text-ink-gray-8">
        <button
          type="button"
          class="block w-full truncate text-left after:absolute after:inset-0 after:z-10 focus-visible:outline-none"
          @click="openNote(note.name)"
        >
          {{ note.title }}
        </button>
      </h3>
      <NoteActions :note="note" class="relative z-20" />
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
        class="relative z-20 flex shrink-0 items-center"
        :aria-label="note.ownerName || note.owner"
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
