/**
 * External dependencies.
 */
import { useMemo } from "react";
import { Avatar } from "@rtcamp/frappe-ui-react";
import { format, isSameMonth, isToday, isTomorrow, parseISO } from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { UpcomingTimeOffSkeleton } from "./skeleton";
import type { TimeOffGroup } from "./types";
import type { EmployeesOnLeaveResponse } from "../../types";

function formatDateLabel(from: string, to: string): string {
  const fromDate = parseISO(from);
  if (from === to) {
    if (isToday(fromDate)) return "Today";
    if (isTomorrow(fromDate)) return "Tomorrow";
    return format(fromDate, "MMM d");
  }
  const toDate = parseISO(to);
  if (isSameMonth(fromDate, toDate)) {
    return `${format(fromDate, "MMM d")} - ${format(toDate, "d")}`;
  }
  return `${format(fromDate, "MMM d")} - ${format(toDate, "MMM d")}`;
}

function formatDurationLabel(halfDay: 0 | 1, half: string | null): string {
  if (!halfDay) return "Full day";
  const normalized = (half ?? "").trim().toLowerCase();
  if (normalized === "first half") return "First half";
  if (normalized === "second half") return "Second half";
  return "Half day";
}

export default function UpcomingTimeOff() {
  const { data, isLoading } = useFrappeGetCall<EmployeesOnLeaveResponse>(
    "next_pms.api.dashboard.get_employees_on_leave",
  );

  const groups = useMemo<TimeOffGroup[]>(() => {
    const byWindow = new Map<string, TimeOffGroup>();
    for (const row of data?.message ?? []) {
      const key = `${row.from_date}|${row.to_date}|${row.half_day}|${row.custom_first_halfsecond_half ?? ""}`;
      let group = byWindow.get(key);
      if (!group) {
        group = {
          key,
          label: `${formatDateLabel(row.from_date, row.to_date)}, ${formatDurationLabel(row.half_day, row.custom_first_halfsecond_half)}`,
          people: [],
        };
        byWindow.set(key, group);
      }
      group.people.push({
        employee: row.employee,
        name: row.employee_name,
        image: row.user_image,
      });
    }
    return Array.from(byWindow.values());
  }, [data]);

  if (isLoading) {
    return <UpcomingTimeOffSkeleton />;
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-outline-gray-1 bg-surface-cards p-4">
      <h3 className="text-lg font-semibold text-ink-gray-8">
        Upcoming time-offs
      </h3>
      {groups.length === 0 ? (
        <p className="py-8 text-center text-base text-ink-gray-5">
          No upcoming time-offs.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {groups.map((group) => (
            <div key={group.key} className="flex items-start gap-1.5 py-2">
              <div className="w-[3px] shrink-0 self-stretch rounded-[5px] bg-surface-gray-4" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xs text-ink-gray-5">{group.label}</span>
                <div className="flex min-w-0 items-center gap-1">
                  <div className="flex items-center justify-center pb-1">
                    {group.people.map((person, index) => (
                      <div
                        key={`${person.employee}-${index}`}
                        className="-mr-1 last:mr-0"
                        style={{ zIndex: group.people.length - index }}
                      >
                        <Avatar
                          size="xs"
                          shape="circle"
                          image={person.image ?? undefined}
                          label={person.name}
                        />
                      </div>
                    ))}
                  </div>
                  <span className="truncate text-base font-medium text-ink-gray-7">
                    {group.people.map((person) => person.name).join(", ")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
