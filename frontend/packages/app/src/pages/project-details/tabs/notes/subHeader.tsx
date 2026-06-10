/**
 * External dependencies.
 */
import { useNavigate, useParams } from "react-router-dom";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { Dropdown, Filter } from "@rtcamp/frappe-ui-react";
import { AddSm, SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { CREATE_OPTIONS } from "./constants";

type NotesSubHeaderProps = {
  filters: FilterCondition[];
  onFiltersChange: (v: FilterCondition[]) => void;
};

export function NotesSubHeader({
  filters,
  onFiltersChange,
}: NotesSubHeaderProps) {
  const navigate = useNavigate();
  const { projectId = "" } = useParams<{ projectId: string }>();

  return (
    <div className="flex items-center justify-between gap-8">
      <h2 className="text-xl font-semibold text-ink-gray-7">Notes</h2>
      <div className="flex items-center gap-2">
        <Filter
          align="end"
          value={filters}
          onChange={onFiltersChange}
          fields={[
            {
              name: "creation",
              label: "Creation Date",
              type: "daterange",
            },
          ]}
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
