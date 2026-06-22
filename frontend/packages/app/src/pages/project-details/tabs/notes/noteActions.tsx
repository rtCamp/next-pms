/**
 * External dependencies.
 */
import { useNavigate } from "react-router-dom";
import { Button, Dropdown } from "@rtcamp/frappe-ui-react";
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
import { useNotes } from "./context";
import { exportNote } from "./detail/utils";
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

  return (
    <span className="flex items-center" onClick={(e) => e.stopPropagation()}>
      {note.pinned ? (
        <Button
          onClick={() => void togglePin(note.name)}
          variant="ghost"
          icon={() => <Unpin className="size-4" />}
          disabled={isUpdating}
          aria-label="Unpin note"
        />
      ) : null}
      <Dropdown
        placement="right"
        button={{ variant: "ghost", icon: DotHorizontal }}
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
            disabled: isUpdating,
            onClick: () => openDeleteDialog(note.name),
          },
        ]}
      />
    </span>
  );
}
