/**
 * External dependencies.
 */
import { useRef } from "react";
import ReactQuill, { Quill, type ReactQuillProps } from "react-quill";
import "react-quill/dist/quill.snow.css";
import ImageResize from "quill-image-resize-module-react";

/**
 * Internal dependencies.
 */

import { mergeClassNames } from "../../utils";
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
    toolbarOptions[6].push("image");
  }
  if (allowVideoUpload) {
    toolbarOptions[6].push("video");
  }
  const modules = {
    toolbar: toolbarOptions,

    clipboard: { matchVisual: false },
  };
  if (allowImageUpload) {
    modules.imageResize = {
      modules: ["Resize", "DisplaySize", "Toolbar"],
    };
  }
  const handleChange = (value: string) => {
    onChange(value);
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
      />
    </>
  );
};

export default TextEditor;
