import { watch, type Ref } from "vue";
import type { TiptapEditor } from "frappe-ui/editor";

/**
 * Sets attributes on the editor's content element, such as its accessible
 * name. frappe-ui's Editor has no prop for them, so they go through the
 * instance it exposes. Tiptap puts `role="textbox"` there unless `role` is set.
 */
export function useEditorAttributes(
  editorRef: Readonly<Ref<{ editor: TiptapEditor | null } | null>>,
  attributes: () => Record<string, string>,
) {
  watch(
    [() => editorRef.value?.editor, attributes],
    ([editor, attrs]) => {
      editor?.setOptions({
        editorProps: { ...editor.options.editorProps, attributes: attrs },
      });
    },
    { immediate: true },
  );
}
