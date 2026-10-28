import { generateJSON, getSchema, type Extensions } from "@tiptap/core";
import { Node, type Schema } from "@tiptap/pm/model";
import {
  domOutputSpecToHTMLString,
  renderToHTMLString,
} from "@tiptap/static-renderer/pm/html-string";
import DOMPurify from "dompurify";
import { common, createLowlight } from "lowlight";
import { kitExtensions } from "./kits";
import type { RichTextKitName } from "./types";

const kits = new Map<
  RichTextKitName,
  { extensions: Extensions; schema: Schema }
>();

/** A kit's extensions and schema, built once. */
function kit(name: RichTextKitName) {
  let entry = kits.get(name);
  if (!entry) {
    const extensions = kitExtensions(name);
    entry = { extensions, schema: getSchema(extensions) };
    kits.set(name, entry);
  }
  return entry;
}

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

function joinChildren(children?: string | string[]) {
  return Array.isArray(children) ? children.join("") : (children ?? "");
}

// A read-only checkbox, named by its item's text, instead of the editor's
// clickable, unlabelled one.
function renderTaskItem({
  node,
  children,
}: {
  node: Node;
  children?: string | string[];
}) {
  const checked = Boolean(node.attrs.checked);
  return (
    `<li data-type="taskItem" data-checked="${checked}"><label>` +
    `<input type="checkbox" disabled${checked ? " checked" : ""} aria-label="${escapeHtml(node.textContent)}">` +
    `<span></span></label><div>${joinChildren(children)}</div></li>`
  );
}

// Wide tables scroll inside their own box, as in the editor.
function renderTable({
  node,
  children,
}: {
  node: Node;
  children?: string | string[];
}) {
  const spec = node.type.spec.toDOM?.(node);
  const table = spec
    ? domOutputSpecToHTMLString(spec)(children)
    : `<table><tbody>${joinChildren(children)}</tbody></table>`;
  return `<div class="tableWrapper" tabindex="0">${table}</div>`;
}

/**
 * Stored editor HTML as static HTML: sanitized, parsed with the kit's schema,
 * and re-rendered, with code blocks highlighted.
 */
export function renderRichText(
  html: string,
  kitName: RichTextKitName = "comment",
): string {
  const { extensions } = kit(kitName);
  return renderToHTMLString({
    content: generateJSON(DOMPurify.sanitize(html), extensions),
    extensions,
    options: {
      nodeMapping: {
        codeBlock: renderCodeBlock,
        taskItem: renderTaskItem,
        table: renderTable,
      },
    },
  });
}

/** Plain text of an HTML fragment, one line per block, for the clipboard. */
export function plainText(
  html: string,
  kitName: RichTextKitName = "comment",
): string {
  const { extensions, schema } = kit(kitName);
  const doc = Node.fromJSON(schema, generateJSON(html, extensions));
  return doc.textBetween(0, doc.content.size, "\n");
}
