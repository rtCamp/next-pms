<script setup lang="ts">
import { computed, ref, useTemplateRef, watch, type HTMLAttributes } from "vue";
import { Avatar, Button, TextInput } from "frappe-ui";
import { CommentKit, Editor, EditorContent } from "frappe-ui/editor";
import { stripTags } from "@/utils/text";
import type { CommentMention } from "./types";
import { useEditorAttributes } from "@/composables/useEditorAttributes";

const props = withDefaults(
  defineProps<{
    submit: (content: string) => Promise<void>;
    mentions?: CommentMention[];
    placeholder?: string;
    initialValue?: string;
    isSubmitting?: boolean;
    focusOnOpen?: boolean;
    resetOnSubmit?: boolean;
    cancellable?: boolean;
    submitLabel?: string;
    collapsible?: boolean;
    triggerClass?: HTMLAttributes["class"];
    avatarName?: string;
    avatarImage?: string | null;
  }>(),
  {
    placeholder: "Add a comment...",
    initialValue: "",
    submitLabel: "Post",
  },
);

const emit = defineEmits<{ cancel: [] }>();

// The kit is built once per editor, so mentions are read through a getter to
// pick up a list that loads after mount. Media is off: no upload handler is wired.
const extensions = [
  CommentKit.configure({
    mention: { items: () => props.mentions ?? [] },
    image: false,
    video: false,
    attachment: false,
  }),
];

const draft = ref(props.initialValue);
const expanded = ref(
  !props.collapsible ||
    props.focusOnOpen ||
    stripTags(props.initialValue).length > 0,
);
const pending = ref(false);

watch(
  () => props.initialValue,
  (value) => {
    draft.value = value;
  },
);

const editorRef = useTemplateRef("editor");
useEditorAttributes(editorRef, () => ({
  role: "textbox",
  "aria-multiline": "true",
  "aria-label": props.placeholder,
}));

// Opening the editor is the user's request to type, so focus moves into it.
watch(
  () => editorRef.value?.editor,
  (editor) => {
    if (editor && (props.focusOnOpen || props.collapsible)) {
      editor.commands.focus("start");
    }
  },
  { immediate: true },
);

const busy = computed(() => props.isSubmitting || pending.value);
const isEmpty = computed(() => stripTags(draft.value ?? "").length === 0);

async function handleSubmit() {
  if (isEmpty.value || busy.value) return;
  pending.value = true;
  try {
    await props.submit(draft.value);
  } catch {
    // The caller reports the error; keep the draft so nothing typed is lost.
    return;
  } finally {
    pending.value = false;
  }
  if (props.resetOnSubmit || props.collapsible) draft.value = "";
  if (props.collapsible) expanded.value = false;
}

function handleCancel() {
  draft.value = props.initialValue;
  if (props.collapsible) expanded.value = false;
  emit("cancel");
}
</script>

<template>
  <div v-if="!expanded" class="flex items-center gap-3" :class="triggerClass">
    <Avatar
      v-if="avatarName || avatarImage"
      size="lg"
      shape="circle"
      :label="avatarName"
      :image="avatarImage ?? undefined"
    />
    <!-- eslint-disable better-tailwindcss/no-restricted-classes -- frappe-ui has no 40px input size with 14px text and 12px padding -->
    <TextInput
      variant="outline"
      class="w-full [&_[data-slot=control]]:h-10 [&_[data-slot=control]]:px-3"
      :placeholder="placeholder"
      :aria-label="placeholder"
      @focus="expanded = true"
    />
    <!-- eslint-enable better-tailwindcss/no-restricted-classes -->
  </div>

  <div v-else class="flex w-full flex-col gap-2">
    <Editor
      ref="editor"
      v-model="draft"
      :extensions="extensions"
      :placeholder="placeholder"
      :editable="!busy"
    >
      <EditorContent
        class="prose-sm max-h-52 min-h-8 w-full max-w-full overflow-auto rounded-4 border border-outline-gray-2 bg-surface-base px-3 py-2 text-ink-gray-8 prose-p:my-0 focus:outline-none"
      />
    </Editor>
    <div class="flex items-center justify-end gap-2">
      <Button
        v-if="cancellable || collapsible"
        variant="ghost"
        size="sm"
        label="Cancel"
        :disabled="busy"
        @click="handleCancel"
      />
      <Button
        variant="solid"
        theme="gray"
        size="sm"
        :label="submitLabel"
        :loading="busy"
        :disabled="isEmpty || busy"
        @click="handleSubmit"
      />
    </div>
  </div>
</template>
