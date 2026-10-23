/** `get_members_without_allocation`; only `count` is shown. */
export interface MembersWithoutAllocation {
  count: number;
}

/** `get_outstanding_timesheets`; only `count` is shown. */
export interface OutstandingTimesheets {
  count: number;
}

/** A row of `get_timesheets_to_review`; the card shows how many there are. */
export interface TimesheetToReview {
  name: string;
}
