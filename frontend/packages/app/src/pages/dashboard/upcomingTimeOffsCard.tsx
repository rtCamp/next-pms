/**
 * External dependencies.
 */
import { Avatar } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { UPCOMING_TIME_OFFS } from "./constants";

export type TimeOffEntry = {
  date: string;
  members: string[];
};

export function UpcomingTimeOffsCard() {
  return (
    <div className="flex max-w-xs flex-col gap-3 rounded-lg border border-outline-gray-1 bg-surface-cards p-4">
      <h3 className="text-lg font-semibold text-ink-gray-8">
        Upcoming time-offs
      </h3>
      <div className="flex flex-col gap-1">
        {UPCOMING_TIME_OFFS.map((entry) => (
          <div key={entry.date} className="flex gap-1.5 py-2">
            <div className="w-[3px] shrink-0 self-stretch rounded-full bg-surface-gray-4" />
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-xs text-ink-gray-5">{entry.date}</span>
              <div className="flex items-center gap-2">
                <div className="flex shrink-0 items-center gap-1">
                  {entry.members.map((name) => (
                    <Avatar key={name} size="sm" label={name} />
                  ))}
                </div>
                <span className="truncate text-base font-medium text-ink-gray-7">
                  {entry.members.join(", ")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
