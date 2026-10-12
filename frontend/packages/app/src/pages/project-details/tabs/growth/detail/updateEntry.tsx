/**
 * External dependencies.
 */
import { formatRelativeTimeShort } from "@next-pms/design-system/utils";
import { Avatar, Dropdown, StaticTextEditor } from "@rtcamp/frappe-ui-react";
import { DotHorizontal } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { currencyFormat } from "@/lib/utils";
import { PriorityBadge } from "../list/cells/priorityBadge";
import { StatusBadge } from "../list/cells/statusBadge";
import type { EnrichedGrowthUpdateEntry } from "../types";

const PILL_CLASS = "bg-surface-gray-2 rounded-full px-2 py-1";

interface UpdateEntryProps {
  entry: EnrichedGrowthUpdateEntry;
  currency: string;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function UpdateEntry({
  entry,
  currency,
  canEdit,
  onEdit,
  onDelete,
}: UpdateEntryProps) {
  const author = entry.updated_by_details?.full_name ?? entry.updated_by;

  return (
    <>
      <div className="flex flex-wrap gap-2 items-center mt-1 mb-2">
        <Avatar
          size="sm"
          shape="circle"
          image={entry.updated_by_details?.user_image ?? undefined}
          label={author}
        />
        <span className="text-base font-medium text-ink-gray-7">{author}</span>
        <span className="text-base text-ink-gray-6">posted an update.</span>
        <span className="ml-auto text-base text-ink-gray-5">
          {formatRelativeTimeShort(entry.updated_at)}
        </span>
      </div>

      <div className="pb-4 pl-4 ml-2 border-l border-outline-gray-1 last:border-transparent">
        <div className="p-4 rounded border border-outline-gray-1">
          <div className="flex flex-wrap gap-1 items-center text-sm text-ink-gray-7 not-last:mb-2">
            {entry.status && (
              <div className={PILL_CLASS}>
                <StatusBadge status={entry.status} />
              </div>
            )}
            {entry.closed_status && (
              <div className={PILL_CLASS}>{entry.closed_status}</div>
            )}
            {entry.client_priority && (
              <PriorityBadge priority={entry.client_priority} />
            )}
            {entry.billable_outcome ? (
              <div className={PILL_CLASS}>
                {currencyFormat(currency).format(entry.billable_outcome)}
              </div>
            ) : null}

            {canEdit && (
              <Dropdown
                placement="center"
                button={{
                  variant: "ghost",
                  icon: DotHorizontal,
                  className: "ml-auto",
                }}
                options={[
                  { key: "edit", label: "Edit", onClick: onEdit },
                  {
                    key: "delete",
                    label: "Delete",
                    theme: "red",
                    onClick: onDelete,
                  },
                ]}
              />
            )}
          </div>

          {entry.note && (
            <StaticTextEditor
              content={entry.note}
              editorClass="prose prose-sm max-w-none text-ink-gray-7"
            />
          )}
        </div>
      </div>
    </>
  );
}
