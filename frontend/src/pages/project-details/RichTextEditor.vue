<script setup lang="ts">
import { useTemplateRef } from "vue";
import { Editor, EditorContent } from "frappe-ui/editor";
import { RICH_TEXT_KIT_CLASS, richTextExtensions } from "@/components/RichText";
import { useEditorAttributes } from "@/composables/useEditorAttributes";
import { cn } from "@/utils/cn";

const props = defineProps<{
  /** The editor's accessible name. */
  label: string;
  disabled?: boolean;
  placeholder?: string;
  /** Classes merged onto the editable area, e.g. a fixed height. */
  contentClass?: string;
}>();

const model = defineModel<string>({ required: true });

const extensions = richTextExtensions();

const editorRef = useTemplateRef("editor");
useEditorAttributes(editorRef, () => ({
  role: "textbox",
  "aria-multiline": "true",
  "aria-label": props.label,
}));
</script>

<template>
  <Editor
    ref="editor"
    v-model="model"
    :extensions="extensions"
    :editable="!disabled"
    :placeholder="placeholder"
  >
    <EditorContent
      :class="
        cn(
          RICH_TEXT_KIT_CLASS,
          'prose-sm w-full max-w-full rounded-5 p-2 leading-normal prose-p:my-2 text-ink-gray-7 ring-1 ring-outline-gray-2 focus:ring-outline-gray-4',
          contentClass,
        )
      "
    />
  </Editor>
</template>
