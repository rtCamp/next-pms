/**
 * External dependencies.
 */
import { useEffect, useState, useRef, useCallback } from "react";
import ReactQuill, { Quill } from "react-quill";
import { DeltaStatic, Sources } from "quill";
import "react-quill/dist/quill.snow.css";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ImageResize from "quill-image-resize-module-react";

/**
 * Internal dependencies.
 */

import PlainClipboard from "./clipboard";
import { TextEditorProps, User } from "./types";
import { deBounce, mergeClassNames, preProcessLink } from "../../utils";

const Inline = Quill.import("blots/inline");

class MentionBlot extends Inline {
  static blotName = "mention";
  static className = "mention";
  static tagName = "SPAN";

  static create(value: {
    id?: string;
    value?: string;
    label?: string;
    className?: string;
  }) {
    const node = super.create() as HTMLElement;
    node.setAttribute("data-mention", "true");
    if (value?.id) node.setAttribute("data-id", String(value.id));
    if (value?.value) node.setAttribute("data-value", String(value.value));
    if (value?.label) node.setAttribute("data-label", String(value.label));
    node.className = `mention ${value?.className ?? ""}`.trim();
    return node;
  }

  static formats(node: HTMLElement) {
    return {
      id: node.getAttribute("data-id") || "",
      value: node.getAttribute("data-value") || "",
      label: node.getAttribute("data-label") || "",
    };
  }

  format(name: string, value: unknown) {
    if (name === MentionBlot.blotName && value && typeof value === "object") {
      const val = value as {
        id?: string;
        value?: string;
        label?: string;
        className?: string;
      };
      if (val.id)
        (this.domNode as HTMLElement).setAttribute("data-id", String(val.id));
      if (val.value)
        (this.domNode as HTMLElement).setAttribute(
          "data-value",
          String(val.value),
        );
      if (val.label)
        (this.domNode as HTMLElement).setAttribute(
          "data-label",
          String(val.label),
        );
      return;
    }
    super.format(name, value);
  }
}

Quill.register("modules/imageResize", ImageResize);
Quill.register("modules/clipboard", PlainClipboard, true);
Quill.register(MentionBlot);

const TextEditor = ({
  allowImageUpload = false,
  allowVideoUpload = false,
  className,
  onChange,
  hideToolbar = false,
  enableMentions = false,
  onFetchUsers,
  mentionClassName = "bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold border border-blue-200 whitespace-nowrap inline-block cursor-pointer",
  ...Props
}: TextEditorProps) => {
  const [editorValue, setEditorValue] = useState(Props.value || "");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<User[]>([]);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const quillRef = useRef<ReactQuill>(null);
  const mentionStartIndex = useRef<number>(-1);
  const mentionEndIndex = useRef<number>(-1);

  useEffect(() => {
    if (Props?.value !== undefined) {
      setEditorValue(Props.value);
    }
  }, [Props?.value]);

  const toolbarOptions = [
    ["bold", "italic"],
    [{ color: [] }],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    [{ align: [] }],
    ["link"],
  ];
  if (allowImageUpload) {
    // @ts-expect-error expected
    toolbarOptions[6].push("image");
  }
  if (allowVideoUpload) {
    // @ts-expect-error expected
    toolbarOptions[6].push("video");
  }
  const modules = {
    toolbar: hideToolbar ? false : toolbarOptions,

    clipboard: { matchVisual: false },
  };
  if (allowImageUpload) {
    // @ts-expect-error expected
    modules.imageResize = {
      modules: ["Resize", "DisplaySize", "Toolbar"],
    };
  }

  const debouncedFetchUsers = useCallback(
    deBounce(async (searchTerm: string) => {
      if (!onFetchUsers) return;
      try {
        const users = await onFetchUsers(searchTerm);
        setMentionUsers(users);
        setSelectedMentionIndex(0);
        setShowMentions(true);
      } catch (error) {
        console.error("Error fetching users:", error);
        setShowMentions(false);
      }
    }, 300),
    [onFetchUsers],
  );

  const detectMention = useCallback(
    async (editor: ReactQuill.UnprivilegedEditor) => {
      if (!enableMentions || !onFetchUsers) return;

      const selection = editor.getSelection();
      if (!selection) return;

      const text = editor.getText();
      const cursorPosition = selection.index;

      let atIndex = -1;
      for (let i = cursorPosition - 1; i >= 0; i--) {
        if (text[i] === "@") {
          atIndex = i;
          break;
        }
        if (text[i] === " " || text[i] === "\n") {
          break;
        }
      }

      if (atIndex === -1) {
        setShowMentions(false);
        mentionStartIndex.current = -1;
        mentionEndIndex.current = -1;
        return;
      }

      const searchTerm = text.slice(atIndex + 1, cursorPosition);

      if (!/^[a-zA-Z0-9\s]*$/.test(searchTerm)) {
        setShowMentions(false);
        mentionStartIndex.current = -1;
        mentionEndIndex.current = -1;
        return;
      }

      mentionStartIndex.current = atIndex;
      mentionEndIndex.current = cursorPosition;

      const bounds = editor.getBounds(cursorPosition);
      if (bounds && quillRef.current) {
        const editorElement = quillRef.current.getEditor().root;
        const editorRect = editorElement.getBoundingClientRect();

        setMentionPosition({
          top: editorRect.top + bounds.top + bounds.height + 5,
          left: editorRect.left + bounds.left,
        });
      }

      debouncedFetchUsers(searchTerm);
    },
    [enableMentions, debouncedFetchUsers, onFetchUsers],
  );

  const selectMention = useCallback(
    (user: User) => {
      if (
        !quillRef.current ||
        mentionStartIndex.current === -1 ||
        mentionEndIndex.current === -1
      ) {
        return;
      }

      const editor = quillRef.current.getEditor();

      const startIndex = mentionStartIndex.current;
      const endIndex = mentionEndIndex.current;
      const replaceLength = endIndex - startIndex;

      try {
        editor.focus();

        editor.deleteText(startIndex, replaceLength);

        const mentionText = `${user.value}`;
        editor.insertText(startIndex, mentionText + " ", "user");

        setTimeout(() => {
          try {
            const currentHtml = editor.root.innerHTML;
            const mentionHtml = `<span class="mention ${mentionClassName}" data-type="mention" data-id="${user.id}" data-value="${user.value}" data-label="${user.value}" data-mention="true">${mentionText}</span>`;
            const updatedHtml = currentHtml.replace(
              new RegExp(
                mentionText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                "g",
              ),
              mentionHtml,
            );
            editor.root.innerHTML = updatedHtml;
            const event = new Event("input", { bubbles: true });
            editor.root.dispatchEvent(event);
            const newContent = editor.root.innerHTML;
            onChange(newContent);
            const mentionElements = editor.root.querySelectorAll(
              'span.mention, span[data-mention="true"]',
            );
            mentionElements.forEach((span) => {
              const htmlSpan = span as HTMLElement;
              htmlSpan.className = `mention ${mentionClassName}`;
              if (!htmlSpan.getAttribute("data-mention")) {
                htmlSpan.setAttribute("data-mention", "true");
              }
            });

            const newCursorPosition = startIndex + mentionText.length + 1;
            editor.setSelection(newCursorPosition, 0);
            editor.focus();
          } catch (error) {
            console.error("Error applying mention styling:", error);
          }
        }, 50);
      } catch (error) {
        console.error("Error inserting mention:", error);
        editor.deleteText(startIndex, replaceLength);
        const fallbackText = `@${user.value} `;
        editor.insertText(startIndex, fallbackText, "user");
        const fallbackCursorPosition = startIndex + fallbackText.length;
        setTimeout(() => {
          editor.setSelection(fallbackCursorPosition, 0);
          editor.focus();
        }, 10);
      }

      setShowMentions(false);
      mentionStartIndex.current = -1;
      mentionEndIndex.current = -1;
    },
    [mentionClassName, onChange],
  );

  const handleMentionDeletion = useCallback(() => {
    if (!quillRef.current) return false;

    const quill = quillRef.current.getEditor();
    const selection = quill.getSelection();
    if (!selection || selection.length > 0) return false;

    const currentIndex = selection.index;
    if (currentIndex === 0) return false;

    try {
      const fullText = quill.getText();
      const textBeforeCursor = fullText.slice(0, currentIndex);

      const htmlContent = quill.root.innerHTML;
      // Match mention spans regardless of whether inner text includes '@'
      // Capture groups:
      // 1: data-value (if present)
      // 2: inner text of the span
      const mentionRegex =
        /<span[^>]*class="[^"]*mention[^"]*"[^>]*data-value="([^"]*)"[^>]*>([^<]*)<\/span>/g;

      let match;
      const mentions = [];

      while ((match = mentionRegex.exec(htmlContent)) !== null) {
        // Prefer inner text; fallback to data-value
        const innerText = match[2] ?? "";
        const dataValue = match[1] ?? innerText;
        const mentionValue = innerText || dataValue;
        const fullMentionText = `${mentionValue}`;
        mentions.push({
          value: mentionValue,
          fullText: fullMentionText,
          htmlMatch: match[0],
        });
      }

      for (const mention of mentions) {
        const mentionIndex = textBeforeCursor.lastIndexOf(mention.fullText);
        if (
          mentionIndex !== -1 &&
          mentionIndex + mention.fullText.length === currentIndex
        ) {
          quill.deleteText(mentionIndex, mention.fullText.length);
          quill.setSelection(mentionIndex, 0);
          return true;
        }
      }

      if (currentIndex > 0) {
        for (const mention of mentions) {
          const mentionStartIndex = textBeforeCursor.lastIndexOf(
            mention.fullText,
          );
          if (
            mentionStartIndex !== -1 &&
            currentIndex > mentionStartIndex &&
            currentIndex <= mentionStartIndex + mention.fullText.length
          ) {
            quill.deleteText(mentionStartIndex, mention.fullText.length);
            quill.setSelection(mentionStartIndex, 0);
            return true;
          }
        }
      }
    } catch (error) {
      console.error("Error in mention deletion:", error);
    }

    return false;
  }, []);

  const handleMentionKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!showMentions || mentionUsers.length === 0) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedMentionIndex((prev) =>
            prev < mentionUsers.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedMentionIndex((prev) =>
            prev > 0 ? prev - 1 : mentionUsers.length - 1,
          );
          break;
        case "Enter":
          event.preventDefault();
          if (mentionUsers[selectedMentionIndex]) {
            selectMention(mentionUsers[selectedMentionIndex]);
          }
          break;
        case "Escape":
          event.preventDefault();
          setShowMentions(false);
          break;
      }
    },
    [showMentions, mentionUsers, selectedMentionIndex, selectMention],
  );

  const handleBackspace = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== "Backspace" || !quillRef.current || !enableMentions)
        return;

      const handled = handleMentionDeletion();

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [enableMentions, handleMentionDeletion],
  );

  const formatHtml = (html: string) => {
    return preProcessLink(html);
  };
  const handleChange = (
    value: string,
    delta: DeltaStatic,
    source: Sources,
    editor: ReactQuill.UnprivilegedEditor,
  ) => {
    let actualHtml = value;

    if (quillRef.current && enableMentions) {
      const editorHtml = quillRef.current.getEditor().root.innerHTML;
      actualHtml = editorHtml;
    }

    const formattedValue = formatHtml(actualHtml);
    setEditorValue(formattedValue);

    if (editor.getText()?.trim()) {
      onChange(formattedValue);
    } else {
      onChange("");
    }

    if (enableMentions && source === "user") {
      detectMention(editor);
    }
  };

  useEffect(() => {
    if (!enableMentions || !quillRef.current) return;
    const quill = quillRef.current.getEditor();

    quill.clipboard.addMatcher("span", (node, delta) => {
      const element = node as HTMLElement;
      const isMention =
        element.classList.contains("mention") ||
        element.getAttribute("data-mention") === "true" ||
        element.hasAttribute("data-value");

      if (isMention) {
        const label =
          element.getAttribute("data-label") || element.textContent || "";
        const valueAttr = element.getAttribute("data-value") || label;
        const idAttr = element.getAttribute("data-id") || valueAttr;
        return new (Quill.import("delta"))().insert(label, {
          mention: { id: idAttr, value: valueAttr, label },
        });
      }
      return delta;
    });

    try {
      const root = quill.root;
      const spans = root.querySelectorAll(
        'span.mention, span[data-mention="true"], span[data-value]',
      );
      spans.forEach((span) => {
        const el = span as HTMLElement;
        el.className = `mention ${mentionClassName}`;
        if (!el.getAttribute("data-mention"))
          el.setAttribute("data-mention", "true");
      });
    } catch (error) {
      console.error("Error in mention styling:", error);
    }
  }, [enableMentions, mentionClassName]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showMentions) {
        handleMentionKeyDown(event);
      }
      handleBackspace(event);
    };

    if (enableMentions) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [showMentions, enableMentions, handleMentionKeyDown, handleBackspace]);

  useEffect(() => {
    if (!enableMentions || !quillRef.current) return;

    const styleMentions = () => {
      const editor = quillRef.current?.getEditor();
      if (editor) {
        const mentionElements = editor.root.querySelectorAll(
          'span.mention, span[data-mention="true"], span[data-value]',
        );
        mentionElements.forEach((span: Element) => {
          const htmlSpan = span as HTMLElement;
          if (
            !htmlSpan.classList.contains("mention") ||
            htmlSpan.className === "mention"
          ) {
            htmlSpan.className = `mention ${mentionClassName}`;
            if (!htmlSpan.getAttribute("data-mention")) {
              htmlSpan.setAttribute("data-mention", "true");
            }
          }
        });
      }
    };

    styleMentions();

    const interval = setInterval(styleMentions, 500);

    return () => clearInterval(interval);
  }, [enableMentions, editorValue, mentionClassName]);
  return (
    <div className="relative">
      <ReactQuill
        ref={quillRef}
        {...Props}
        className={mergeClassNames(
          "border p-2 rounded-md border-input [&>div:first-child]:border-t-0 [&>div:first-child]:border-r-0 [&>div:first-child]:border-l-0 [&>div:first-child]:border-input [&>div:first-child]:border-bottom [&>div:last-child]:border-none text-foreground bg-background whitespace-normal",
          hideToolbar &&
            "border-none !resize-none [&_.ql-editor]:min-h-0 [&_.ql-editor]:p-2",
          !hideToolbar && "break-all",
          className,
        )}
        theme="snow"
        formats={[
          "bold",
          "italic",
          "color",
          "list",
          "indent",
          "align",
          "link",
          "mention",
        ]}
        modules={modules}
        onChange={handleChange}
        value={editorValue}
      />

      {/* Custom Mention Dropdown */}
      {showMentions && mentionUsers.length > 0 && (
        <div
          className="fixed z-50 bg-background border border-foreground/10 rounded-lg shadow-lg max-h-48 overflow-y-auto min-w-64"
          style={{
            top: mentionPosition.top,
            left: mentionPosition.left,
          }}
        >
          {mentionUsers.map((user, index) => (
            <div
              key={user.id}
              className={mergeClassNames(
                "px-3 py-2 cursor-pointer flex items-center gap-2 hover:bg-foreground/10",
                index === selectedMentionIndex &&
                  "bg-blue-50 text-blue-700 hover:bg-blue-50",
              )}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={() => selectMention(user)}
            >
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700">
                {user.value.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium">{user.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TextEditor;
