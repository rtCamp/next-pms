<script setup lang="ts">
import { useTemplateRef } from "vue";
import { cva } from "class-variance-authority";
import { Editor, EditorContent } from "frappe-ui/editor";
import { RICH_TEXT_KIT_CLASS, richTextExtensions } from "@/components/RichText";
import { useEditorAttributes } from "@/composables/useEditorAttributes";
import { cn } from "@/utils/cn";

const props = defineProps<{
  /** The editor's accessible name. */
  label: string;
  disabled?: boolean;
  placeholder?: string;
  /** `outline` (default) draws a box; `borderless` is bare, for a page-wide body. */
  variant?: "outline" | "borderless";
  /** Classes merged onto the editable area, e.g. a fixed height. */
  contentClass?: string;
}>();

const model = defineModel<string>({ required: true });

const extensions = richTextExtensions();

const contentVariants = cva("prose-sm w-full max-w-full leading-normal", {
  variants: {
    variant: {
      outline:
        "rounded-5 p-2 text-ink-gray-7 ring-1 ring-outline-gray-2 prose-p:my-2 focus:ring-outline-gray-4",
      borderless:
        "text-ink-gray-6 prose-headings:text-ink-gray-7 focus-visible:outline-none",
    },
  },
  defaultVariants: { variant: "outline" },
});

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
          contentVariants({ variant: props.variant }),
          contentClass,
        )
      "
    />
  </Editor>
</template>
