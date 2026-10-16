<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import { Button, DatePicker, ErrorMessage, FormLabel } from "frappe-ui";
import { CommentKit, Editor, EditorContent } from "frappe-ui/editor";
import { DurationInput } from "@/components/DurationInput";
import { useEditorAttributes } from "@/composables/useEditorAttributes";

export interface TimeEntryFormErrors {
  duration?: string;
  date?: string;
  comment?: string;
}

const props = defineProps<{
  mode: "add" | "edit";
  hoursLeft: number;
  /** Label above the duration, with the hours left; none hides both. */
  durationLabel?: string;
  maxDuration: number;
  /** Whether this form's save is in flight. */
  saving: boolean;
  /** Whether any save or delete is in flight; turns the inputs off. */
  mutating: boolean;
  /** Whether the values are what the form opened with, which turns Save off. */
  unchanged: boolean;
  errors: TimeEntryFormErrors;
  submitError?: string | null;
}>();

const duration = defineModel<number>("duration", { required: true });
const comment = defineModel<string>("comment", { required: true });
const date = defineModel<string>("date", { required: true });

const emit = defineEmits<{
  save: [];
  /** A pointer went down in the comment, e.g. on its resize handle. */
  commentPointerdown: [event: PointerEvent];
}>();

defineSlots<{
  /** Actions after Save entry, e.g. Delete entry. */
  default?: () => unknown;
}>();

// The React editor had no media, mentions, tags or emoji.
const extensions = [
  CommentKit.configure({
    mention: false,
    tag: false,
    emoji: false,
    image: false,
    imageGroup: false,
    imageViewer: false,
    video: false,
    attachment: false,
  }),
];

const editorRef = useTemplateRef("editor");
useEditorAttributes(editorRef, () => ({
  role: "textbox",
  "aria-multiline": "true",
  "aria-label": "Comment",
}));

const saveDisabled = computed(() => props.mutating || props.unchanged);

function onCommentKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    emit("save");
  }
}
</script>

<template>
  <div class="flex w-full flex-col gap-2">
    <DurationInput
      v-model="duration"
      snap="smooth"
      :hours-left="hoursLeft"
      :label="durationLabel"
      required
      inline-label="Duration"
      :max-duration="maxDuration"
      :disabled="mutating"
      :error="errors.duration"
    />
    <div v-if="mode === 'edit'" class="flex w-full flex-col gap-1.5">
      <FormLabel label="Edit date" size="sm" required />
      <DatePicker
        v-model="date"
        variant="outline"
        format="MMM D, YYYY"
        placeholder="Select date"
        :clearable="false"
        :disabled="mutating"
        align="start"
        aria-label="Date"
      >
        <template #suffix>
          <span class="lucide-calendar size-4 shrink-0" aria-hidden="true" />
        </template>
      </DatePicker>
      <ErrorMessage v-if="errors.date" :message="errors.date" />
    </div>
    <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -- catches Cmd/Ctrl+Enter and pointer-downs from the editor inside -->
    <div
      class="relative w-full"
      @keydown.capture="onCommentKeydown"
      @pointerdown.capture="emit('commentPointerdown', $event)"
    >
      <Editor
        ref="editor"
        v-model="comment"
        :extensions="extensions"
        placeholder="Comment"
        :editable="!mutating"
      >
        <EditorContent
          class="prose-sm box-border h-24 max-h-60 min-h-24 w-full min-w-64 max-w-[min(680px,calc(90vw-2rem))] resize overflow-auto rounded-5 border border-outline-gray-2 bg-surface-base px-2 text-base text-ink-gray-7 prose-p:my-1 focus:outline-none"
        />
      </Editor>
      <span
        v-if="comment === ''"
        class="absolute bottom-1 right-2 text-xs text-ink-gray-4"
        aria-hidden="true"
      >
        ⌘+↵
      </span>
    </div>
    <ErrorMessage v-if="errors.comment" :message="errors.comment" />
    <ErrorMessage v-if="submitError" :message="submitError" />
    <div class="flex w-full justify-between gap-2">
      <Button
        variant="subtle"
        size="sm"
        label="Save entry"
        icon-left="lucide-plus"
        :loading="saving"
        :disabled="saveDisabled"
        @click="emit('save')"
      />
      <slot />
    </div>
  </div>
</template>
