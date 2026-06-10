/**
 * External dependencies.
 */
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { Avatar, Dropdown } from "@rtcamp/frappe-ui-react";
import { DotHorizontal, Edit1, Export } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { formatRelativeTimeShort, stripTags } from "@/lib/utils";
import type { Note } from "../types";

const FILENAME_TITLE_CAP = 50;

function exportNote(note: Note) {
  const safeTitle =
    note.title
      .slice(0, FILENAME_TITLE_CAP)
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "note";
  const filename = `${safeTitle}-${format(new Date(), "yyyy-MM-dd-HHmmss")}.txt`;
  const content = `${note.title}\n\n${stripTags(note.description)}`;
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/plain;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  // Defer revoke so the browser has started reading the blob; revoking
  // synchronously after click() can abort the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

type NoteDetailHeaderProps = {
  note: Note;
};

export function NoteDetailHeader({ note }: NoteDetailHeaderProps) {
  const navigate = useNavigate();
  const { projectId = "" } = useParams<{ projectId: string }>();
  const lastUpdated = formatRelativeTimeShort(
    note.last_edited_at ?? note.modified,
  );
  const authorHref = `/desk/user/${encodeURIComponent(note.owner)}`;

  return (
    <div className="flex items-center justify-between gap-8">
      <div className="flex min-w-0 items-center gap-2">
        <a href={authorHref} className="shrink-0 flex items-center">
          <Avatar
            size="xs"
            shape="circle"
            label={note.owner_full_name}
            image={note.owner_image || undefined}
          />
        </a>
        <span className="truncate text-base font-medium text-ink-gray-7">
          {note.owner_full_name}
        </span>
        <span className="shrink-0 text-ink-gray-5">·</span>
        <span className="shrink-0 text-base text-ink-gray-5">
          last updated {lastUpdated}
        </span>
      </div>
      <Dropdown
        placement="right"
        button={{ variant: "ghost", icon: DotHorizontal }}
        options={[
          {
            label: "Edit",
            key: "edit",
            icon: <Edit1 />,
            onClick: () =>
              navigate(
                `${ROUTES.project}/${projectId}/notes/${note.name}/edit`,
              ),
          },
          {
            label: "Export note",
            key: "export",
            icon: <Export />,
            onClick: () => exportNote(note),
          },
        ]}
      />
    </div>
  );
}
