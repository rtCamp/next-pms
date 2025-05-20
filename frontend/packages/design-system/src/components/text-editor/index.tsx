/**
 * External dependencies.
 */
import { useRef, useState } from "react";
import ReactQuill, { Quill, type ReactQuillProps } from "react-quill";
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
  const quillRef = useRef<ReactQuill | null>(null);
  const [editorValue, setEditorValue] = useState(Props.value || "");
  const toolbarOptions = [
    [{ header: [1, 2, 3, false] }, { font: [] }],
    ["bold", "italic", "underline", "strike", "blockquote", "code-block"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    ["link"],
    ["clean"],
    ["table"],
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
    toolbar: hideToolbar ? [] : toolbarOptions,

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
  const handleChange = (value: string) => {
    const formattedValue = formatHtml(value);
    setEditorValue(formattedValue);
    onChange(formattedValue);
  };

  return (
    <>
      {hideToolbar && (
        <style>{`
          .ql-toolbar{
            display:none !important;
            border:none !important;
          }
          .ql-editor{
            min-height:0px !important;
            padding: 8px !important;
          }
      `}</style>
      )}
      <ReactQuill
        {...Props}
        ref={quillRef}
        style={{ resize: "vertical", overflow: "auto" }}
        className={mergeClassNames(
          "border rounded-md border-input [&>div:first-child]:border-t-0 [&>div:first-child]:border-r-0 [&>div:first-child]:border-l-0 [&>div:first-child]:border-input [&>div:first-child]:border-bottom [&>div:last-child]:border-none text-foreground bg-background ",
          hideToolbar && "border-none !resize-none",
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
