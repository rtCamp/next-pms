/**
 * External dependencies.
 */
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Dropdown, Select, TextInput } from "@rtcamp/frappe-ui-react";
import { AddSm, SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { CREATE_OPTIONS } from "./constants";
import { TemplateDialog } from "./templateDialog";
import type { NoteAuthorOption } from "./types";

type NotesSubHeaderProps = {
  titleInput: string;
  descriptionInput: string;
  author: string;
  authorOptions: NoteAuthorOption[];
  onTitleInputChange: (value: string) => void;
  onDescriptionInputChange: (value: string) => void;
  onAuthorChange: (value: string) => void;
};

export function NotesSubHeader({
  titleInput,
  descriptionInput,
  author,
  authorOptions,
  onTitleInputChange,
  onDescriptionInputChange,
  onAuthorChange,
}: NotesSubHeaderProps) {
  const navigate = useNavigate();
  const { projectId = "" } = useParams<{ projectId: string }>();
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

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
              onClick: () => setIsTemplateDialogOpen(true),
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
      <TemplateDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        projectId={projectId}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 gap-2">
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
        <Select
          size="sm"
          placeholder="Select Author"
          className="w-fit"
          value={author}
          onChange={(value) => onAuthorChange((value ?? "") as string)}
          options={authorOptions}
        />
      </div>
    </div>
  );
}
