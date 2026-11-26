import type { FieldHelp } from "@/components/InfoHoverCard";
import EntrySample from "./EntrySample.vue";

export const CALENDAR_HELP = {
  entries: {
    title: "Calendar entries",
    summary:
      "Each entry shows its type with a colour and an icon, and its status beside the title.",
    legend: [
      { label: "Milestone, spans dates", component: EntrySample },
      {
        label: "Touchpoint, one date",
        component: EntrySample,
        props: { isTouchpoint: true },
      },
      {
        label: "Marked complete",
        component: EntrySample,
        props: { isComplete: true },
      },
      {
        label: "Marked internal",
        component: EntrySample,
        props: { isInternal: true },
      },
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
