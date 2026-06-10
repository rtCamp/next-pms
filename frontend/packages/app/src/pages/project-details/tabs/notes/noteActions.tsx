/**
 * External dependencies.
 */
import { useNavigate, useSearchParams } from "react-router-dom";
import { Dropdown } from "@rtcamp/frappe-ui-react";
import { Delete, DotHorizontal, Edit1, Export } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { useProjectDetail } from "@/pages/project-details/context";
import { NOTE_PARAM } from "./constants";
import { useNotes } from "./context";
import { exportNote } from "./detail/utils";
import type { Note } from "./types";

const ICON_CLASS = "size-4 mr-2";

type NoteActionsProps = {
  note: Note;
};

/**
 * Shared 3-dot actions dropdown rendered on both the note card and the note
 * detail header. Stops click propagation so the dropdown works inside the
 * clickable card.
 */
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
            icon: <Edit1 className={ICON_CLASS} />,
            disabled: isDeleting,
            onClick: () =>
              navigate(`${ROUTES.project}/${projectId}/notes/${note.name}/edit`),
          },
          {
            key: "export",
            label: "Export note",
            icon: <Export className={ICON_CLASS} />,
            onClick: () => exportNote(note),
          },
          {
            key: "delete",
            label: "Delete",
            theme: "red",
            icon: <Delete className={ICON_CLASS} />,
            disabled: isDeleting,
            onClick: () => void handleDelete(),
          },
        ]}
      />
    </span>
  );
}
