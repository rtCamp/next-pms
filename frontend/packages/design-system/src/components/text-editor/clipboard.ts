// CustomClipboard.js
import Quill from "quill";

const Clipboard = Quill.import("modules/clipboard");
const Delta = Quill.import("delta");

class PlainClipboard extends Clipboard {
  onPaste(e) {
    e.preventDefault();

    const range = this.quill.getSelection();
    const text = e.clipboardData.getData("text/plain");

    const delta = new Delta()
      .retain(range.index)
      .delete(range.length)
      .insert(text);
    const index = text.length + range.index;
    const length = 0;

    this.quill.updateContents(delta, "user");
    this.quill.setSelection(index, length, "silent");
    this.quill.scrollIntoView();
  }
}

export default PlainClipboard;
