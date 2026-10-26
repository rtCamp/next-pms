import type { SortState } from "@/components/SortSelector";
import { toPerson } from "@/pages/project-details/shared/permissions";
import type {
  RecordGroup,
  UserDetails,
} from "@/pages/project-details/shared/types";
import {
  withAddedUpdate,
  withEditedUpdate,
  withoutUpdate,
} from "@/pages/project-details/shared/updateLog";
import { formatProjectDate } from "@/utils/date";
import { formatCurrency } from "@/utils/format";
import { stripTags } from "@/utils/text";
import {
  CLOSED_GROWTH_COLUMNS,
  DEFAULT_GROWTH_SORT,
  GROWTH_UPDATE_FIELDS,
  OPEN_GROWTH_COLUMNS,
  type GrowthColumnKey,
} from "./constants";
import type {
  ClientPriority,
  GrowthDoc,
  GrowthFilters,
  GrowthForm,
  GrowthFormErrors,
  GrowthItem,
  GrowthRow,
  GrowthStatus,
  GrowthUpdate,
  GrowthUpdateErrors,
  GrowthUpdateForm,
  GrowthUpdateItem,
} from "./types";

type Users = ReadonlyMap<string, UserDetails>;

export const EMPTY_GROWTH_FILTERS: GrowthFilters = {
  activityOwner: "",
  ideationOwner: "",
  status: "",
  category: "",
};

export function growthListFilters(
  projectId: string,
  filters: GrowthFilters,
): unknown[][] {
  const out: unknown[][] = [["project", "=", projectId]];
  if (filters.activityOwner)
    out.push(["activity_owner", "=", filters.activityOwner]);
  if (filters.ideationOwner)
    out.push(["ideation_owner", "=", filters.ideationOwner]);
  if (filters.status) out.push(["status", "=", filters.status]);
  if (filters.category) out.push(["category", "=", filters.category]);
  return out;
}

export function hasActiveFilters(filters: GrowthFilters): boolean {
  return Object.values(filters).some(Boolean);
}

export function growthOrderBy(sort: SortState | null): string {
  const { field, order } = sort ?? DEFAULT_GROWTH_SORT;
  return `${field} ${order}`;
}

/** The distinct activity and ideation owners of the project's initiatives, in first-seen order. */
export function growthPeople(
  rows: readonly Pick<GrowthRow, "activity_owner" | "ideation_owner">[],
) {
  const unique = (ids: (string | null)[]) => [
    ...new Set(ids.filter((id): id is string => Boolean(id))),
  ];
  return {
    activityOwners: unique(rows.map((row) => row.activity_owner)),
    ideationOwners: unique(rows.map((row) => row.ideation_owner)),
  };
}

/** An owner filter's options: each user by full name, with their avatar. */
export function ownerFilterOptions(userIds: readonly string[], users: Users) {
  return userIds.map((userId) => {
    const person = toPerson(userId, users.get(userId));
    return { label: person.label, value: userId, image: person.image };
  });
}

/** A Select's options from master names: "All …" first. */
export function nameFilterOptions(
  allLabel: string,
  docs: readonly { name: string }[],
) {
  return [
    { label: allLabel, value: "" },
    ...docs.map((doc) => ({ label: doc.name, value: doc.name })),
  ];
}

/** The statuses of type Status; the Status filter and pickers offer only these, as React. */
export function openStatuses(statuses: readonly GrowthStatus[]) {
  return statuses.filter((status) => status.status_type === "Status");
}

export function closedStatuses(statuses: readonly GrowthStatus[]) {
  return statuses.filter((status) => status.status_type === "Closed Status");
}

/** Whether `status` closes an initiative, so it needs a closed status. */
export function isClosingStatus(
  statuses: readonly GrowthStatus[],
  status: string,
): boolean {
  return statuses.some(
    (option) => option.name === status && Boolean(option.is_closed),
  );
}

export function toGrowthItems(
  rows: readonly GrowthRow[],
  users: Users,
): GrowthItem[] {
  return rows.map((row) => ({
    ...row,
    ownerPerson: row.activity_owner
      ? toPerson(row.activity_owner, users.get(row.activity_owner))
      : null,
  }));
}

/** The open and closed groups, each with its own columns. */
export function growthGroups(
  items: readonly GrowthItem[],
): RecordGroup<GrowthItem, GrowthColumnKey>[] {
  return [
    {
      value: "open",
      label: "Open Growth Initiatives",
      columns: OPEN_GROWTH_COLUMNS,
      rows: items.filter((item) => !item.is_closed),
    },
    {
      value: "closed",
      label: "Closed Growth Initiatives",
      columns: CLOSED_GROWTH_COLUMNS,
      rows: items.filter((item) => Boolean(item.is_closed)),
    },
  ];
}

/** A datetime's date in the project date format, e.g. "Oct 26". */
export function lastUpdatedText(modified: string): string {
  return formatProjectDate(modified.slice(0, 10));
}

/** The updates newest first (the stored order reversed, as React), with their authors. */
export function growthUpdateItems(
  updates: readonly GrowthUpdate[],
  users: Users,
): GrowthUpdateItem[] {
  return [...updates].reverse().map((update) => ({
    ...update,
    author: toPerson(
      update.updated_by ?? "",
      users.get(update.updated_by ?? ""),
    ),
  }));
}

/** The users the detail shows: its owners and update authors. */
export function growthDetailUserIds(doc: GrowthDoc | null): string[] {
  if (!doc) return [];
  return [
    doc.activity_owner ?? "",
    doc.ideation_owner ?? "",
    ...(doc.update_log ?? []).map((update) => update.updated_by ?? ""),
  ].filter(Boolean);
}

/** The detail's "Details" rows. */
export function growthDetails(doc: GrowthDoc, currency?: string | null) {
  return [
    { label: "Category", value: doc.category ?? "—" },
    {
      label: "Ideation date",
      value: doc.ideation_date ? formatProjectDate(doc.ideation_date) : "—",
    },
    {
      label: "Billable outcome",
      value: formatCurrency(doc.billable_outcome ?? 0, currency),
    },
    { label: "Last updated", value: lastUpdatedText(doc.modified) },
  ];
}

function amountText(value: number | null | undefined): string {
  return value ? String(value) : "";
}

/** The dialog's values: the initiative's, or a new one's dated `today`. */
export function growthForm(doc: GrowthDoc | null, today: string): GrowthForm {
  return {
    activity: doc?.activity ?? "",
    category: doc?.category ?? "",
    description: doc?.description ?? "",
    client_priority: doc?.client_priority ?? "",
    status: doc?.status ?? "",
    closed_status: doc?.closed_status ?? "",
    desired_outcome: doc?.desired_outcome ?? "",
    ideation_date: doc ? (doc.ideation_date ?? "") : today,
    activity_owner: doc?.activity_owner ?? "",
    ideation_owner: doc?.ideation_owner ?? "",
    billable_outcome: amountText(doc?.billable_outcome),
  };
}

function billableError(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" || Number(trimmed) >= 0
    ? undefined
    : "Billable outcome must be zero or greater.";
}

export function validateGrowthForm(
  form: GrowthForm,
  closing: boolean,
): GrowthFormErrors {
  const errors: GrowthFormErrors = {};
  if (!form.activity.trim()) errors.activity = "Please enter an activity.";
  if (!form.status.trim()) errors.status = "Please select a status.";
  if (!form.ideation_date.trim())
    errors.ideation_date = "Please pick an ideation date.";
  if (closing && !form.closed_status)
    errors.closed_status = "Please select a closed status.";
  const billable = billableError(form.billable_outcome);
  if (billable) errors.billable_outcome = billable;
  return errors;
}

/** The fields an edit saves; status, priority and billable outcome change only through updates. */
export function editGrowthPayload(form: GrowthForm) {
  return {
    activity: form.activity,
    category: form.category || null,
    description: form.description,
    desired_outcome: form.desired_outcome,
    ideation_date: form.ideation_date,
    activity_owner: form.activity_owner || null,
    ideation_owner: form.ideation_owner || null,
  };
}

export function createGrowthPayload(
  projectId: string,
  form: GrowthForm,
  closing: boolean,
) {
  return {
    project: projectId,
    ...editGrowthPayload(form),
    client_priority: form.client_priority,
    status: form.status,
    closed_status: closing ? form.closed_status : null,
    billable_outcome: form.billable_outcome ? Number(form.billable_outcome) : 0,
  };
}

/** The dialog's values: the update's, or a new update's starting from the initiative's. */
export function growthUpdateForm(
  doc: GrowthDoc,
  update?: GrowthUpdate | null,
): GrowthUpdateForm {
  const source = update ?? doc;
  return {
    status: source.status ?? "",
    closed_status: source.closed_status ?? "",
    client_priority: source.client_priority ?? "",
    billable_outcome: amountText(source.billable_outcome),
    note: update?.note ?? "",
  };
}

export function validateGrowthUpdateForm(
  form: GrowthUpdateForm,
  closing: boolean,
): GrowthUpdateErrors {
  const errors: GrowthUpdateErrors = {};
  if (closing && !form.closed_status)
    errors.closed_status = "Please select a closed status.";
  const billable = billableError(form.billable_outcome);
  if (billable) errors.billable_outcome = billable;
  if (!stripTags(form.note)) errors.note = "Note is required.";
  return errors;
}

/** What an update sets; an empty status, priority or billable outcome is left as it was. */
function updateChanges(form: GrowthUpdateForm, closing: boolean) {
  return {
    ...(form.status && {
      status: form.status,
      closed_status: closing ? form.closed_status : null,
    }),
    ...(form.client_priority && {
      client_priority: form.client_priority as ClientPriority,
    }),
    ...(form.billable_outcome !== "" && {
      billable_outcome: Number(form.billable_outcome),
    }),
    note: form.note,
  };
}

export function addedGrowthUpdateLog(
  doc: GrowthDoc,
  form: GrowthUpdateForm,
  closing: boolean,
) {
  return withAddedUpdate(
    doc.update_log ?? [],
    GROWTH_UPDATE_FIELDS,
    updateChanges(form, closing),
  );
}

export function editedGrowthUpdateLog(
  doc: GrowthDoc,
  name: string,
  form: GrowthUpdateForm,
  closing: boolean,
) {
  return withEditedUpdate(
    doc.update_log ?? [],
    GROWTH_UPDATE_FIELDS,
    name,
    updateChanges(form, closing),
  );
}

export function deletedGrowthUpdateLog(doc: GrowthDoc, name: string) {
  return withoutUpdate(doc.update_log ?? [], GROWTH_UPDATE_FIELDS, name);
}
