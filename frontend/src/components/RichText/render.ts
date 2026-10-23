import { generateJSON, getSchema } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import { renderToHTMLString } from "@tiptap/static-renderer/pm/html-string";
import DOMPurify from "dompurify";
import { CommentKit } from "frappe-ui/editor";
import { common, createLowlight } from "lowlight";

/** The schema comments, notes and status updates are written with. */
const EXTENSIONS = [CommentKit];
const SCHEMA = getSchema(EXTENSIONS);

// The editor's own language set, so whatever can be written can be shown.
const lowlight = createLowlight(common);

type HastNode = ReturnType<typeof lowlight.highlight>["children"][number];

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

function escapeHtml(text: string) {
  return text.replace(/[&<>"]/g, (char) => ESCAPES[char]!);
}

function hastToHtml(node: HastNode): string {
  if (node.type === "text") return escapeHtml(node.value);
  if (node.type !== "element") return "";
  const className = node.properties?.className;
  const classes = Array.isArray(className) ? className.join(" ") : "";
  const children = node.children.map(hastToHtml).join("");
  return `<${node.tagName} class="${escapeHtml(classes)}">${children}</${node.tagName}>`;
}

function renderCodeBlock({ node }: { node: Node }) {
  const language = (node.attrs.language as string | null) ?? "";
  const tree =
    language && lowlight.registered(language)
      ? lowlight.highlight(language, node.textContent)
      : lowlight.highlightAuto(node.textContent);
  const languageClass = language
    ? ` class="language-${escapeHtml(language)}"`
    : "";
  // Long lines scroll sideways, so the block takes focus for the keyboard.
  return `<pre tabindex="0"><code${languageClass}>${tree.children.map(hastToHtml).join("")}</code></pre>`;
}

/**
 * Stored editor HTML as static HTML: sanitized, parsed with the editor's
 * schema, and re-rendered, with code blocks highlighted.
 */
export function renderRichText(html: string): string {
  return renderToHTMLString({
    content: generateJSON(DOMPurify.sanitize(html), EXTENSIONS),
    extensions: EXTENSIONS,
    options: { nodeMapping: { codeBlock: renderCodeBlock } },
  });
}

/** Plain text of an HTML fragment, one line per block, for the clipboard. */
export function plainText(html: string): string {
  const doc = Node.fromJSON(SCHEMA, generateJSON(html, EXTENSIONS));
  return doc.textBetween(0, doc.content.size, "\n");
}
