/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFrappeGetDocList } from "frappe-react-sdk";
import type { FilterCondition, FilterField } from "@rtcamp/frappe-ui-react";
import { Dropdown, Filter } from "@rtcamp/frappe-ui-react";
import { AddSm, SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { CREATE_OPTIONS } from "./constants";

type UserOption = {
  name: string;
  full_name: string;
};

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

  const { data: users } = useFrappeGetDocList<UserOption>("User", {
    fields: ["name", "full_name"],
    limit: 0,
  });

  const fields = useMemo<FilterField[]>(
    () => [
      {
        name: "author",
        label: "Author",
        type: "select",
        options: (users ?? []).map((u) => ({
          label: u.full_name || u.name,
          value: u.name,
        })),
      },
    ],
    [users],
  );

  return (
    <div className="flex items-center justify-between gap-8">
      <h2 className="text-xl font-semibold text-ink-gray-7">Notes</h2>
      <div className="flex items-center gap-2">
        <Filter
          align="end"
          value={advanced}
          onChange={onAdvancedChange}
          fields={fields}
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
