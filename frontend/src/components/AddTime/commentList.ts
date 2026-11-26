import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { TiptapEditor } from "frappe-ui/editor";

/** Lets list items carry an id (`data-item-id`), so a calendar event's item can be found again. */
export const IdentifiedListItem = Extension.create({
  name: "identifiedListItem",
  addGlobalAttributes() {
    return [
      {
        types: ["listItem"],
        attributes: {
          itemId: {
            default: null,
            parseHTML: (element) => element.getAttribute("data-item-id"),
            renderHTML: (attributes) =>
              attributes.itemId ? { "data-item-id": attributes.itemId } : {},
          },
        },
      },
    ];
  },
});

function findListItem(editor: TiptapEditor, id: string) {
  let found: { pos: number; node: ProseMirrorNode } | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "listItem" && node.attrs.itemId === id) {
      found = { pos, node };
    }
  });
  return found as { pos: number; node: ProseMirrorNode } | null;
}

/** End of the last bullet list holding an identified item, inside the list. */
function identifiedListEnd(editor: TiptapEditor): number | null {
  let end: number | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name !== "bulletList") return;
    let identified = false;
    node.forEach((child) => {
      if (child.attrs.itemId) identified = true;
    });
    if (identified) end = pos + node.nodeSize - 1;
  });
  return end;
}

function isEmptyDoc(editor: TiptapEditor) {
  const { doc } = editor.state;
  return (
    doc.childCount === 1 &&
    doc.firstChild?.type.name === "paragraph" &&
    doc.firstChild.content.size === 0
  );
}

/**
 * Appends a bullet with this id to the identified list, starting the list at the end
 * of the comment (or in place of an empty comment) when there is none.
 */
export function addListItem(editor: TiptapEditor, id: string, text: string) {
  const item = {
    type: "listItem",
    attrs: { itemId: id },
    content: [
      {
        type: "paragraph",
        content: text ? [{ type: "text", text }] : [],
      },
    ],
  };
  const listEnd = identifiedListEnd(editor);
  if (listEnd !== null) {
    editor.chain().insertContentAt(listEnd, item).run();
    return;
  }
  const size = editor.state.doc.content.size;
  const range = isEmptyDoc(editor)
    ? { from: 0, to: size }
    : { from: size, to: size };
  editor
    .chain()
    .insertContentAt(range, { type: "bulletList", content: [item] })
    .run();
}

/** Removes the bullet with this id, and its list when it was the only item. */
export function removeListItem(editor: TiptapEditor, id: string) {
  const found = findListItem(editor, id);
  if (!found) return;
  const $pos = editor.state.doc.resolve(found.pos);
  const list = $pos.parent;
  if (list.type.name === "bulletList" && list.childCount === 1) {
    const listStart = $pos.before();
    editor
      .chain()
      .deleteRange({ from: listStart, to: listStart + list.nodeSize })
      .run();
    return;
  }
  editor
    .chain()
    .deleteRange({ from: found.pos, to: found.pos + found.node.nodeSize })
    .run();
}
