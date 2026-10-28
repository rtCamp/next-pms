import type { Editor, Extensions } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import { TaskItem, TaskList } from "frappe-ui/editor";

interface TaskView {
  editor: Editor;
  getPos: () => number | undefined;
}

/**
 * Task lists whose checkboxes still toggle while the editor is read-only: a toggle
 * updates the item in the document, so the editor's model changes and the caller
 * can save it. Pair with `richTextExtensions({ taskList: false })`.
 */
export function readOnlyTaskExtensions(): Extensions {
  // onReadOnlyChecked gets the node its view was created with, not its position.
  const views = new WeakMap<Node, TaskView>();

  const ReadOnlyTaskItem = TaskItem.extend({
    addNodeView() {
      const render = this.parent?.();
      if (!render) return null;
      return (props) => {
        views.set(props.node, { editor: props.editor, getPos: props.getPos });
        return render(props);
      };
    },
  }).configure({
    onReadOnlyChecked: (node, checked) => {
      const view = views.get(node);
      const pos = view?.getPos();
      const current =
        pos === undefined ? null : view?.editor.state.doc.nodeAt(pos);
      if (!view || pos === undefined || !current) return false;
      view.editor.view.dispatch(
        view.editor.state.tr.setNodeMarkup(pos, undefined, {
          ...current.attrs,
          checked,
        }),
      );
      return true;
    },
  });

  return [TaskList, ReadOnlyTaskItem];
}
