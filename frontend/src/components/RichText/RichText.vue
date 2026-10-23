<script setup lang="ts">
import { computed, normalizeClass, useAttrs } from "vue";
import { RICH_TEXT_KIT_CLASS } from "./kits";
import { plainText, renderRichText } from "./render";
import type { RichTextProps } from "./types";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<RichTextProps>(), { kit: "comment" });
const attrs = useAttrs();

const html = computed(() => renderRichText(props.content, props.kit));

// Same typography as frappe-ui's EditorContent: `prose-v3` unless a size is set.
const rootClass = computed(() => {
  const incoming = normalizeClass(attrs.class);
  const sized = /(?:^|\s)prose-(?:sm|base|lg|xl|2xl)(?:\s|$)/.test(incoming);
  return [
    "ProseMirror prose max-w-none",
    !sized && "prose-v3",
    props.kit === "richText" && RICH_TEXT_KIT_CLASS,
    incoming,
  ];
});

// Copied text gets one line per block instead of the DOM's extra blank lines.
function onCopy(event: ClipboardEvent) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !event.clipboardData) return;
  const container = document.createElement("div");
  container.append(selection.getRangeAt(0).cloneContents());
  event.clipboardData.setData(
    "text/plain",
    plainText(container.innerHTML, props.kit),
  );
  event.clipboardData.setData("text/html", container.innerHTML);
  event.preventDefault();
}
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- sanitized, then re-rendered from the editor schema -->
  <div v-bind="{ ...attrs, class: rootClass }" @copy="onCopy" v-html="html" />
</template>
