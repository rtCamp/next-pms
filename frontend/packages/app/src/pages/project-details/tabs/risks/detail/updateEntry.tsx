/**
 * External dependencies.
 */
import { formatRelativeTimeShort } from "@next-pms/design-system/utils";
import { Avatar, Dropdown, StaticTextEditor } from "@rtcamp/frappe-ui-react";
import { DotHorizontal } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { RiskLevelBadge } from "../riskLevelBadge";
import { RiskStatusBadge } from "../riskStatusBadge";
import type { EnrichedRiskUpdateEntry } from "../types";

interface UpdateEntryProps {
  entry: EnrichedRiskUpdateEntry;
  onEdit: () => void;
  onDelete: () => void;
}

export function UpdateEntry({ entry, onEdit, onDelete }: UpdateEntryProps) {
  const userDetails = entry.updated_by_details;
  const filteredNote = entry.note ?? "";

  return (
    <>
      {/* Entry meta row */}
      <div className="flex flex-wrap gap-2 items-center mt-1 mb-2">
        <Avatar
          size="sm"
          shape="circle"
          image={userDetails?.user_image ?? undefined}
          label={userDetails?.full_name ?? entry.updated_by}
        />

        <span className="text-sm font-medium text-ink-gray-9">
          {userDetails?.full_name ?? entry.updated_by}
        </span>
        <span className="text-sm text-ink-gray-5">posted an update.</span>
        <span className="ml-auto text-xs text-ink-gray-5">
          {formatRelativeTimeShort(entry.updated_at)}
        </span>
      </div>

      <div className="pb-4 pl-4 ml-2 border-l border-outline-gray-1 last:border-transparent">
        <div className="p-4 rounded border border-outline-gray-1">
          {/* Status + level badges + actions */}
          <div className="flex gap-1 items-center not-last:mb-2">
            {entry.status && (
              <RiskStatusBadge
                status={entry.status}
                className="px-2 py-1 text-sm rounded-full bg-surface-gray-2 text-ink-gray-7"
              />
            )}
            {entry.risk_level && <RiskLevelBadge level={entry.risk_level} />}

            <Dropdown
              placement="center"
              button={{
                variant: "ghost",
                icon: DotHorizontal,
                className: "ml-auto",
              }}
              options={[
                {
                  key: "edit",
                  label: "Edit",
                  onClick: onEdit,
                },
                {
                  key: "delete",
                  label: "Delete",
                  theme: "red",
                  onClick: onDelete,
                },
              ]}
            />
          </div>

          {/* Note text */}
          {filteredNote && <StaticTextEditor content={filteredNote} />}
        </div>
      </div>
    </>
  );
}
