/**
 * External dependencies.
 */
import { File as FileIcon } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { Attachment } from "./types";

type AttachmentListProps = {
  attachments: Attachment[];
};

export function AttachmentList({ attachments }: AttachmentListProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-2 mb-1">
      {attachments.map((attachment) => {
        const filename =
          attachment.file_url.split("/").pop() ?? attachment.file_url;
        return (
          <div
            key={attachment.file_url}
            className="flex items-center gap-1.5 rounded border border-outline-gray-2 bg-surface-gray-2 px-2 py-1 text-sm text-ink-gray-7"
          >
            <FileIcon className="size-3.5 shrink-0 text-ink-gray-5" />
            <span className="max-w-48 truncate">{filename}</span>
          </div>
        );
      })}
    </div>
  );
}
