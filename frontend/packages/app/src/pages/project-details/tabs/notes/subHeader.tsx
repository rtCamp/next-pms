/**
 * External dependencies.
 */
import { useState } from "react";
import { useNavigate } from "react-router";
import { Dropdown, Select, TextInput } from "@rtcamp/frappe-ui-react";
import { AddSm, SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import {
  CREATE_OPTIONS,
  EDITOR_MODE_PARAM,
  TEMPLATE_EDITOR_MODE,
} from "./constants";
import { useNotes } from "./context";
import { TemplateDialog } from "./templateDialog";
import { useProjectDetail } from "../../context";

export function NotesSubHeader() {
  const navigate = useNavigate();
  const projectId = useProjectDetail((s) => s.projectId);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const titleInput = useNotes((s) => s.state.filters.title);
  const descriptionInput = useNotes((s) => s.state.filters.description);
  const author = useNotes((s) => s.state.filters.author);
  const authorOptions = useNotes((s) => s.state.authorOptions);
  const onTitleInputChange = useNotes((s) => s.actions.setTitleInput);
  const onDescriptionInputChange = useNotes(
    (s) => s.actions.setDescriptionInput,
  );
  const onAuthorChange = useNotes((s) => s.actions.setAuthor);

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
            {
              label: "Create template",
              key: CREATE_OPTIONS.createTemplate,
              onClick: () =>
                navigate(
                  `${ROUTES.project}/${projectId}/notes/new?${EDITOR_MODE_PARAM}=${TEMPLATE_EDITOR_MODE}`,
                ),
            },
          ]}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 max-md:flex-col max-md:items-stretch">
        <div className="flex flex-1 gap-2 max-md:flex-col">
          <TextInput
            value={titleInput}
            onChange={(e) => onTitleInputChange(e.target.value)}
            placeholder="Search title"
            className="w-full max-w-64 max-md:max-w-none"
          />
          <TextInput
            value={descriptionInput}
            onChange={(e) => onDescriptionInputChange(e.target.value)}
            placeholder="Search description"
            className="w-full max-w-64 max-md:max-w-none"
          />
        </div>
        <Select
          size="sm"
          placeholder="Select Author"
          placeholderClassName="text-ink-gray-7"
          className="w-fit max-md:w-full"
          value={author}
          onChange={(value) => onAuthorChange((value ?? "") as string)}
          options={authorOptions}
        />
      </div>
      <TemplateDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        projectId={projectId}
      />
    </div>
  );
}
