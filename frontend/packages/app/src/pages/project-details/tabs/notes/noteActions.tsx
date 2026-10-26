/**
 * External dependencies.
 */
import { useNavigate } from "react-router";
import { mergeClassNames as cn } from "@next-pms/design-system";
import { Button, Dropdown, Tooltip } from "@rtcamp/frappe-ui-react";
import {
  Delete,
  DotHorizontal,
  Edit1,
  PinAlt,
  Unpin,
  Export,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { useProjectDetail } from "@/pages/project-details/context";
import { useUser } from "@/providers/user";
import { useNotes } from "./context";
import { exportNote } from "./detail/utils";
import { DELETE_NOTE_TOOLTIP, PIN_TOOLTIP, UNPIN_TOOLTIP } from "./help";
import type { Note } from "./types";

type NoteActionsProps = {
  note: Note;
};

export function NoteActions({ note }: NoteActionsProps) {
  const navigate = useNavigate();
  const projectId = useProjectDetail((s) => s.projectId);
  const togglePin = useNotes((s) => s.actions.togglePin);
  const openDeleteDialog = useNotes((s) => s.actions.openDeleteDialog);
  const isUpdating = useNotes((s) => s.state.isUpdating);
  const currentUser = useUser((s) => s.state.currentUser);

  const isAuthor = Boolean(currentUser) && note.owner === currentUser;

  return (
    <span className="flex items-center" onClick={(e) => e.stopPropagation()}>
      {note.pinned ? (
        <Tooltip text={UNPIN_TOOLTIP}>
          <Button
            onClick={() => void togglePin(note.name)}
            variant="ghost"
            icon={() => <Unpin className="size-4" />}
            disabled={isUpdating}
            aria-label="Unpin note"
          />
        </Tooltip>
      ) : null}
      <Dropdown
        placement="right"
        button={{ variant: "ghost", icon: DotHorizontal }}
        renderMenuItem={(menuProps, { item }) => {
          const isDeleteLocked = item.key === "delete" && !isAuthor;
          const tooltip = isDeleteLocked
            ? DELETE_NOTE_TOOLTIP(note.owner_full_name || note.owner)
            : item.key === "pin"
              ? PIN_TOOLTIP
              : undefined;

          return (
            <Tooltip text={tooltip} disabled={!tooltip}>
              <div
                {...menuProps}
                aria-disabled={isDeleteLocked || undefined}
                className={cn(
                  menuProps.className,
                  isDeleteLocked && "cursor-not-allowed opacity-50",
                )}
              />
            </Tooltip>
          );
        }}
        options={[
          {
            key: "edit",
            label: "Edit",
            icon: <Edit1 className="size-4 mr-2" />,
            disabled: isUpdating,
            onClick: () =>
              navigate(
                `${ROUTES.project}/${projectId}/notes/${note.name}/edit`,
              ),
          },
          {
            key: "pin",
            label: note.pinned ? "Unpin" : "Pin",
            icon: note.pinned ? (
              <Unpin className="size-4 mr-2" />
            ) : (
              <PinAlt className="size-4 mr-2" />
            ),
            disabled: isUpdating,
            onClick: () => void togglePin(note.name),
          },
          {
            key: "export",
            label: "Export",
            icon: <Export className="size-4 mr-2" />,
            onClick: () => exportNote(note),
          },
          {
            key: "delete",
            label: "Delete",
            theme: "red",
            icon: <Delete className="size-4 mr-2" />,
            disabled: isUpdating || !isAuthor,
            onClick: isAuthor ? () => openDeleteDialog(note.name) : undefined,
          },
        ]}
      />
    </span>
  );
}
