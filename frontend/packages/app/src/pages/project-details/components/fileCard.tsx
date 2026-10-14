/**
 * External dependencies.
 */
import { Filetype, Link } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import {
  formatFileSize,
  getFileExtension,
  mergeClassNames as cn,
  safeExternalUrl,
} from "@/lib/utils";
import type { FileAttachment } from "../types";

interface FileCardProps {
  file: FileAttachment;
}

const REMOTE_URL = /^https?:\/\//i;

export function FileCard({ file }: FileCardProps) {
  const isLink = REMOTE_URL.test(file.file_url);
  const href = isLink ? safeExternalUrl(file.file_url) : file.file_url;
  const Icon = isLink ? Link : Filetype;
  const title = isLink
    ? file.file_name
    : file.file_name.replace(/\.[^/.]+$/, "");
  const subtitle = isLink
    ? new URL(file.file_url).hostname
    : `${getFileExtension(file.file_name)} · ${formatFileSize(file.file_size)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={isLink ? file.file_url : undefined}
      className="flex items-center gap-2 p-2 rounded-lg border border-transparent hover:border-outline-gray-1 bg-surface-gray-1 min-w-0 max-w-50"
    >
      <div
        className={cn(
          "flex justify-center items-center rounded shrink-0 size-9",
          isLink ? "text-blue-600 bg-blue-100" : "text-red-600 bg-red-100",
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium truncate text-ink-gray-7">
          {title}
        </p>
        <p className="text-2xs truncate text-ink-gray-5">{subtitle}</p>
      </div>
    </a>
  );
}
