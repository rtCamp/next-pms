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

import { mergeClassNames, preProcessLink } from "../../utils";
export interface TextEditorProps extends ReactQuillProps {
  allowImageUpload?: boolean;
  allowVideoUpload?: boolean;
  className?: string;
  onChange: (value: string) => void;
}

Quill.register("modules/imageResize", ImageResize);
const TextEditor = ({
  allowImageUpload = false,
  allowVideoUpload = false,
  className,
  onChange,
  ...Props
}: TextEditorProps) => {
  const quillRef = useRef<ReactQuill | null>(null);
  const [editorValue, setEditorValue] = useState(quillRef.current?.value || "");
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
    toolbar: toolbarOptions,

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
      <ReactQuill
        {...Props}
        ref={quillRef}
        style={{ resize: "vertical", overflow: "auto" }}
        className={mergeClassNames(
          "border rounded-md border-input [&>div:first-child]:border-t-0 [&>div:first-child]:border-r-0 [&>div:first-child]:border-l-0 [&>div:first-child]:border-input [&>div:first-child]:border-bottom [&>div:last-child]:border-none text-foreground bg-background ",
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
