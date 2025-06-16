/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import ReactQuill, { Quill, type ReactQuillProps } from "react-quill";
import { DeltaStatic, Sources } from "quill";
import "react-quill/dist/quill.snow.css";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ImageResize from "quill-image-resize-module-react";

/**
 * Internal dependencies.
 */

import PlainClipboard from "./clipboard";
import { mergeClassNames, preProcessLink } from "../../utils";
export interface TextEditorProps extends ReactQuillProps {
  allowImageUpload?: boolean;
  allowVideoUpload?: boolean;
  className?: string;
  hideToolbar?: boolean;
  onChange: (value: string) => void;
}

Quill.register("modules/imageResize", ImageResize);
Quill.register("modules/clipboard", PlainClipboard, true);
const TextEditor = ({
  allowImageUpload = false,
  allowVideoUpload = false,
  className,
  onChange,
  hideToolbar = false,
  ...Props
}: TextEditorProps) => {
  const [editorValue, setEditorValue] = useState(Props.value || "");

  useEffect(() => {
    if (Props?.value) {
      setEditorValue(Props.value);
    }
  }, [Props?.value]);

  const toolbarOptions = [
    ["bold", "italic"],
    [{ color: [] }],
    [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
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
  const formatHtml = (html: string) => {
    return preProcessLink(html);
  };
  const handleChange = (value: string, delta: DeltaStatic, source: Sources, editor: ReactQuill.UnprivilegedEditor) => {
    const formattedValue = formatHtml(value);
    setEditorValue(formattedValue);
    if (editor.getText()?.trim()) {
      onChange(formattedValue);
    } else {
      onChange("");
    }
  };
  return (
    <>
      <ReactQuill
        {...Props}
        style={{ resize: "vertical", overflow: "auto" }}
        className={mergeClassNames(
          "border rounded-md border-input [&>div:first-child]:border-t-0 [&>div:first-child]:border-r-0 [&>div:first-child]:border-l-0 [&>div:first-child]:border-input [&>div:first-child]:border-bottom [&>div:last-child]:border-none text-foreground bg-background break-all whitespace-normal",
          hideToolbar && "border-none !resize-none [&_.ql-editor]:min-h-0 [&_.ql-editor]:p-2",
          className
        )}
        theme="snow"
        modules={modules}
        onChange={handleChange}
        value={editorValue}
      />
    </>
  );
};

export default TextEditor;
