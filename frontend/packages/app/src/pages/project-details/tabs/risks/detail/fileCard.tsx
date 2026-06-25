/**
 * External dependencies.
 */
import { Filetype } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { formatFileSize, getFileExtension } from "@/lib/utils";
import type { FileAttachment } from "../types";

interface FileCardProps {
  file: FileAttachment;
}

export function FileCard({ file }: FileCardProps) {
  const ext = getFileExtension(file.file_name);
  const nameWithoutExt = file.file_name.replace(/\.[^/.]+$/, "");

  return (
    <a
      href={file.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-2 rounded-lg border border-transparent hover:border-outline-gray-1 bg-surface-gray-1 min-w-0 max-w-50"
    >
      <div className="flex justify-center items-center text-red-600 bg-red-100 rounded shrink-0 size-9">
        <Filetype className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium truncate text-ink-gray-7">
          {nameWithoutExt}
        </p>
        <p className="text-2xs truncate text-ink-gray-5">
          {ext} · {formatFileSize(file.file_size)}
        </p>
      </div>
    </a>
  );
}
