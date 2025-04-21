/**
 * External dependencies.
 */
import React, { useRef, useEffect, useState, useContext } from "react";
import ReactQuill, { Quill, Value } from "react-quill";
import "react-quill/dist/quill.snow.css";
import ImageResize from "quill-image-resize-module-react";

Quill.register("modules/imageResize", ImageResize);

/**
 * Internal dependencies.
 */
import { ThemeProviderContext } from "@/providers/theme/context";
import { Field } from "../types";

interface EditorProps {
  field: Field;
  onChange: (value: string) => void;
  isReadOnly: boolean;
}

const Editor = ({ field, onChange, isReadOnly }: EditorProps) => {
  const [editorValue, setEditorValue] = useState(field.value);
  const { theme } = useContext(ThemeProviderContext);
  const quillRef = useRef<ReactQuill | null>(null);

  useEffect(() => {
    if (field.value !== editorValue) {
      setEditorValue(field.value);
    }
  }, [field.value]);

  const handleChange = (value: string) => {
    if (value !== field.value) {
      setEditorValue(value);
      onChange(value);
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }, { font: [] }],
      ["bold", "italic", "underline", "strike", "blockquote", "code-block"],
      [{ color: [] }, { background: [] }],
      [{ script: "sub" }, { script: "super" }],
      [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      ["link", "image", "video"],
      ["clean"],
      ["table"],
    ],
    imageResize: {
      modules: ["Resize", "DisplaySize", "Toolbar"],
    },
    clipboard: { matchVisual: false },
  };

  return (
    <>
      <style>
        {`
            .ql-formats > span {
                color: hsl(var(--foreground)) !important;
            }

            .ql-formats > span svg polyline, .ql-formats > span svg line {
                stroke: hsl(var(--foreground)) !important;  
            }

            .ql-formats > span svg:hover polyline, .ql-formats > span svg:hover line, .ql-formats > span svg:hover rect{
                stroke: hsl(210, 100%, 50%) !important;
            }

            .ql-formats button svg path , .ql-formats button svg line , .ql-formats button svg polyline, .ql-formats > button svg rect  {
                stroke: hsl(var(--foreground)) !important;
            }
            .ql-formats button svg:hover path , .ql-formats button svg:hover line, .ql-formats button svg:hover polyline, .ql-formats > button svg:hover rect {
                stroke: hsl(210, 100%, 50%) !important;
            }
            
            ${
              theme === "dark" &&
              `.ql-picker-options{
                                        background:#403c3c !important;
                                        color:hsl(var(--foreground)) !important;
                                        border:none !important;
                                    }
                                    .ql-picker-item{
                                        color:hsl(var(--foreground)) !important;
                                    }
                                    .ql-picker-item:hover{
                                        color: #83838F !important;
                                    }`
            }

            .ql-container {
                height: 300px; /* Set fixed height for editor content */
                overflow-y: auto; 
            }

            .ql-editor {
                min-height: 200px; /* Set minimum height for editor */
            }

            .ql-toolbar {
                position: sticky;
                top: 0;
                z-index: 10;
                background: hsl(var(--background));
            }
        `}
      </style>
      <ReactQuill
        ref={quillRef}
        style={{ resize: "vertical", overflow: "hidden" }}
        className="border rounded-md border-input [&>div:first-child]:border-t-0 [&>div:first-child]:border-r-0 [&>div:first-child]:border-l-0 [&>div:first-child]:border-input [&>div:first-child]:border-bottom [&>div:last-child]:border-none text-foreground bg-background"
        theme="snow"
        modules={modules}
        readOnly={isReadOnly || field.read_only === 1}
        value={editorValue as Value}
        onChange={handleChange}
      />
    </>
  );
};

export default Editor;
