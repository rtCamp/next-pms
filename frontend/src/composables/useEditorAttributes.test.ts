import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, nextTick, ref, shallowRef } from "vue";
import type { TiptapEditor } from "frappe-ui/editor";
import { useEditorAttributes } from "./useEditorAttributes";

interface EditorOptions {
  editorProps: Record<string, unknown>;
}

function fakeEditor() {
  const editor = {
    options: { editorProps: { handleKeyDown: () => false } } as EditorOptions,
    setOptions: vi.fn((options: EditorOptions) => {
      editor.options = { ...editor.options, ...options };
    }),
  };
  return editor;
}

let scope: ReturnType<typeof effectScope>;
beforeEach(() => (scope = effectScope()));
afterEach(() => scope.stop());

describe("useEditorAttributes", () => {
  it("sets the attributes, keeping the other editor props", () => {
    const editor = fakeEditor();
    const editorRef = shallowRef({ editor: editor as unknown as TiptapEditor });
    scope.run(() =>
      useEditorAttributes(editorRef, () => ({ "aria-label": "Description" })),
    );
    expect(editor.setOptions).toHaveBeenCalledWith({
      editorProps: {
        handleKeyDown: expect.any(Function),
        attributes: { "aria-label": "Description" },
      },
    });
  });

  it("waits for the editor, then follows attribute changes", async () => {
    const editor = fakeEditor();
    const editorRef = shallowRef<{ editor: TiptapEditor | null } | null>(null);
    const label = ref("Notes");
    scope.run(() =>
      useEditorAttributes(editorRef, () => ({ "aria-label": label.value })),
    );

    editorRef.value = { editor: editor as unknown as TiptapEditor };
    await nextTick();
    expect(editor.setOptions).toHaveBeenLastCalledWith({
      editorProps: expect.objectContaining({
        attributes: { "aria-label": "Notes" },
      }),
    });

    label.value = "Comment";
    await nextTick();
    expect(editor.setOptions).toHaveBeenCalledTimes(2);
    expect(editor.options.editorProps).toMatchObject({
      attributes: { "aria-label": "Comment" },
    });
  });
});
