/**
 * External dependencies.
 */
import { mergeClassNames as cn } from "@next-pms/design-system";
import type { FieldHelp } from "@next-pms/design-system/components";
import { Lock, Sparkle, Zap } from "@rtcamp/frappe-ui-react/icons";

function EntrySample({
  isTouchpoint,
  isComplete,
  isInternal,
}: {
  isTouchpoint?: boolean;
  isComplete?: boolean;
  isInternal?: boolean;
}) {
  const TypeIcon = isTouchpoint ? Zap : Sparkle;

  return (
    <span
      className={cn(
        "flex grow items-center gap-1 rounded p-1 text-xs",
        isTouchpoint
          ? "bg-surface-violet-1 text-violet-700"
          : "bg-surface-blue-2 text-blue-700",
        isComplete && "opacity-60",
      )}
    >
      <TypeIcon className="size-3 shrink-0" />
      <span className={cn("leading-tight", isComplete && "line-through")}>
        Title
      </span>
      {isInternal && <Lock className="ml-auto size-3 shrink-0" />}
    </span>
  );
}

export const CALENDAR_HELP = {
  entries: {
    title: "Calendar entries",
    summary:
      "Each entry shows its type with a colour and an icon, and its status beside the title.",
    legend: [
      { label: "Milestone, spans dates", children: <EntrySample /> },
      {
        label: "Touchpoint, one date",
        children: <EntrySample isTouchpoint />,
      },
      { label: "Marked complete", children: <EntrySample isComplete /> },
      { label: "Marked internal", children: <EntrySample isInternal /> },
    ],
    wiki: "Project-Detail#behaviour--states-1",
  },
  milestoneActualEnd: {
    title: "Actual end",
    summary:
      "The day the milestone was marked complete. Planned end is the Completion date set on the milestone.",
    details: ["Selecting Mark as incomplete in the row menu clears it again."],
    wiki: "Project-Detail#milestones-and-touchpoints-list",
  },
  touchpointActualDate: {
    title: "Actual date",
    summary:
      "The day the touchpoint was marked complete. Planned date is the Scheduled date set on the touchpoint.",
    details: ["Selecting Mark as incomplete in the row menu clears it again."],
    wiki: "Project-Detail#milestones-and-touchpoints-list",
  },
  watchers: {
    title: "Watchers",
    summary:
      "The people following this entry. They get an email digest of its changes and comments.",
    details: [
      "Select Follow Document in the row menu to follow an entry, or Unfollow Document to stop.",
      "Emails go only to people who turned on Send Notifications For Documents Followed By Me in their user settings in Desk.",
    ],
    wiki: "Project-Detail#behaviour--states-1",
  },
  internal: {
    title: "Mark as internal",
    summary:
      "Use this for entries meant only for your team, not the client. They get a lock icon so they're easy to spot.",
    wiki: "Project-Detail#create-or-edit-a-milestone--touchpoint",
  },
} satisfies Record<string, FieldHelp>;
