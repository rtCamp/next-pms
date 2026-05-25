/**
 * External dependencies.
 */
import { useNavigate, useParams } from "react-router-dom";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { Button, Dropdown, Filter } from "@rtcamp/frappe-ui-react";
import { AddSm, SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { CREATE_OPTIONS, FILTER_FIELDS } from "./constants";

type NotesSubHeaderProps = {
  advanced: FilterCondition[];
  onAdvancedChange: (v: FilterCondition[]) => void;
};

export function NotesSubHeader({
  advanced,
  onAdvancedChange,
}: NotesSubHeaderProps) {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between gap-8">
      <h2 className="text-xl font-semibold text-ink-gray-7">Notes</h2>
      <div className="flex items-center gap-2">
        <Filter
          align="end"
          value={advanced}
          onChange={onAdvancedChange}
          fields={FILTER_FIELDS}
        />
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
    </div>
  );
}
