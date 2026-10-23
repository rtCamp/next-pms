<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { Editor, EditorContent } from "frappe-ui/editor";
import { RICH_TEXT_KIT_CLASS, richTextExtensions } from "@/components/RichText";
import { TASK_SAVE_DELAY_MS } from "./constants";
import { readOnlyTaskExtensions } from "./readOnlyTasks";
import type { Note } from "./types";
import { useNotes } from "./useNotes";

const props = defineProps<{ note: Note }>();

const { saveDescription } = useNotes();

const extensions = [
  ...richTextExtensions({ taskList: false }),
  ...readOnlyTaskExtensions(),
];

/** The body as shown; a task toggle changes it and saves it after a pause. */
const body = ref(props.note.description);
let saved = props.note.description;
let timer: ReturnType<typeof setTimeout> | undefined;

async function save(value: string) {
  timer = undefined;
  if (await saveDescription(props.note, value)) saved = value;
  // A failed save unticks the box again, unless another toggle is waiting.
  else if (!timer) body.value = saved;
}

watch(body, (value) => {
  clearTimeout(timer);
  timer = undefined;
  if (value !== saved)
    timer = setTimeout(() => save(value), TASK_SAVE_DELAY_MS);
});

watch(
  () => props.note.description,
  (description) => {
    if (timer || description === saved) return;
    saved = description;
    body.value = description;
  },
);

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div class="flex flex-col gap-1.5 pt-3">
    <h1 class="text-4xl-semibold leading-tight text-ink-gray-7">
      {{ note.title }}
    </h1>
    <Editor v-model="body" :extensions="extensions" :editable="false">
      <EditorContent
        :class="[
          RICH_TEXT_KIT_CLASS,
          'prose prose-sm max-w-none text-ink-gray-6 prose-headings:text-ink-gray-7',
        ]"
      />
    </Editor>
  </div>
</template>
