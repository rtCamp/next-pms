/**
 * External dependencies.
 */
import { Avatar, Button } from "@rtcamp/frappe-ui-react";
import { MoreHorizontal } from "lucide-react";

/**
 * Internal dependencies.
 */
import { formatRelativeTimeShort, stripTags } from "@/lib/utils";
import { RiskStatusBadge } from "../riskStatusBadge";
import type { EnrichedRiskUpdateEntry } from "../types";
import { RiskLevelBadge } from "./riskLevelBadge";

interface UpdateEntryProps {
  entry: EnrichedRiskUpdateEntry;
}

export function UpdateEntry({ entry }: UpdateEntryProps) {
  const userDetails = entry.owner_details;

  return (
    <>
      {/* Entry meta row */}
      <div className="flex flex-wrap gap-2 items-center mt-1 mb-2">
        <Avatar
          size="sm"
          shape="circle"
          image={userDetails?.user_image ?? undefined}
          label={userDetails?.full_name ?? entry.owner}
        />

        <span className="text-sm font-medium text-ink-gray-9">
          {userDetails?.full_name ?? entry.owner}
        </span>
        <span className="text-sm text-ink-gray-5">posted an update.</span>
        <span className="ml-auto text-xs text-ink-gray-5">
          {formatRelativeTimeShort(entry.updated_at)}
        </span>
      </div>

      <div className="pb-4 pl-4 ml-2 border-l border-outline-gray-1 last:border-transparent">
        <div className="p-4 rounded border border-outline-gray-1">
          {/* Status + level badges */}
          {(entry.status || entry.risk_level) && (
            <div className="flex gap-1 items-center mb-2">
              {entry.status && (
                <RiskStatusBadge
                  status={entry.status}
                  className="px-2 py-1 text-sm rounded-full bg-surface-gray-2 text-ink-gray-7"
                />
              )}
              {entry.risk_level && <RiskLevelBadge level={entry.risk_level} />}

              <Button
                type="button"
                variant="ghost"
                className="ml-auto"
                onClick={() => {}}
                aria-label="Entry options"
                iconLeft={() => <MoreHorizontal />}
              />
            </div>
          )}

          {/* Note text */}
          {entry.note && (
            <p className="text-base leading-relaxed text-ink-gray-8">
              {stripTags(entry.note)}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
