/**
 * External dependencies.
 */
import { useNavigate, useSearchParams } from "react-router-dom";
import { Dropdown } from "@rtcamp/frappe-ui-react";
import {
  Delete,
  DotHorizontal,
  Edit1,
  Export,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { useProjectDetail } from "@/pages/project-details/context";
import { NOTE_PARAM } from "./constants";
import { useNotes } from "./context";
import { exportNote } from "./detail/utils";
import type { Note } from "./types";

type NoteActionsProps = {
  note: Note;
};

export function NoteActions({ note }: NoteActionsProps) {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const projectId = useProjectDetail((s) => s.projectId);
  const deleteNote = useNotes((s) => s.actions.deleteNote);
  const isDeleting = useNotes((s) => s.state.isDeleting);

  const handleDelete = async () => {
    await deleteNote(note.name);
    setSearchParams((prev) => {
      prev.delete(NOTE_PARAM);
      return prev;
    });
  };

  return (
    <span onClick={(e) => e.stopPropagation()}>
      <Dropdown
        placement="right"
        button={{ variant: "ghost", icon: DotHorizontal }}
        options={[
          {
            key: "edit",
            label: "Edit",
            icon: <Edit1 className="size-4 mr-2" />,
            disabled: isDeleting,
            onClick: () =>
              navigate(
                `${ROUTES.project}/${projectId}/notes/${note.name}/edit`,
              ),
          },
          {
            key: "export",
            label: "Export note",
            icon: <Export className="size-4 mr-2" />,
            onClick: () => exportNote(note),
          },
          {
            key: "delete",
            label: "Delete",
            theme: "red",
            icon: <Delete className="size-4 mr-2" />,
            disabled: isDeleting,
            onClick: () => void handleDelete(),
          },
        ]}
      />
    </span>
  );
}
