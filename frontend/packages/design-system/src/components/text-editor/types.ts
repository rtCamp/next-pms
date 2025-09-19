/**
 * External dependencies.
 */
import type { ReactQuillProps } from "react-quill";

export interface User {
  id: string;
  value: string;
}

export interface TextEditorProps extends ReactQuillProps {
  allowImageUpload?: boolean;
  allowVideoUpload?: boolean;
  className?: string;
  hideToolbar?: boolean;
  onChange: (value: string) => void;
  enableMentions?: boolean;
  onFetchUsers?: (query: string) => Promise<User[]> | User[];
  mentionClassName?: string;
}
