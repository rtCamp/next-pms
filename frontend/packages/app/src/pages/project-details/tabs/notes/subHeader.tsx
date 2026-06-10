/**
 * External dependencies.
 */
import { useNavigate, useParams } from "react-router-dom";
import { Dropdown, TextInput } from "@rtcamp/frappe-ui-react";
import { AddSm, SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { CREATE_OPTIONS } from "./constants";

type NotesSubHeaderProps = {
  titleInput: string;
  descriptionInput: string;
  onTitleInputChange: (value: string) => void;
  onDescriptionInputChange: (value: string) => void;
};

export function NotesSubHeader({
  titleInput,
  descriptionInput,
  onTitleInputChange,
  onDescriptionInputChange,
}: NotesSubHeaderProps) {
  const navigate = useNavigate();
  const { projectId = "" } = useParams<{ projectId: string }>();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-ink-gray-7">Notes</h2>
        <Dropdown
          placement="right"
          button={{
            variant: "solid",
            size: "sm",
            iconLeft: AddSm,
            iconRight: SmallDown,
            label: "Create",
          }}
          options={[
            {
              label: "New from template",
              key: CREATE_OPTIONS.newFromTemplate,
              onClick: () =>
                console.info("[notes] New from template — coming soon"),
            },
            {
              label: "New blank note",
              key: CREATE_OPTIONS.newBlankNote,
              onClick: () =>
                navigate(`${ROUTES.project}/${projectId}/notes/new`),
            },
          ]}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <TextInput
          value={titleInput}
          onChange={(e) => onTitleInputChange(e.target.value)}
          placeholder="Search title"
          className="w-full max-w-64"
        />
        <TextInput
          value={descriptionInput}
          onChange={(e) => onDescriptionInputChange(e.target.value)}
          placeholder="Search description"
          className="w-full max-w-64"
        />
      </div>
    </div>
  );
}
