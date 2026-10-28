import type { FilterCondition } from "@/components/Filter";
import type { SortState } from "@/components/SortSelector";
import { toPerson } from "@/pages/project-details/shared/permissions";
import type {
  RecordGroup,
  UserDetails,
} from "@/pages/project-details/shared/types";
import {
  newestFirst,
  withAddedUpdate,
  withEditedUpdate,
  withoutUpdate,
} from "@/pages/project-details/shared/updateLog";
import { buildFilterConditions } from "@/utils/filters";
import { stripTags } from "@/utils/text";
import {
  DEFAULT_RISK_SORT,
  MITIGATED_STATUS,
  RISK_COLUMNS,
  RISK_UPDATE_FIELDS,
  type RiskColumnKey,
} from "./constants";
import type {
  RiskDoc,
  RiskForm,
  RiskFormErrors,
  RiskItem,
  RiskQuickFilters,
  RiskRow,
  RiskUpdate,
  RiskUpdateForm,
  RiskUpdateItem,
} from "./types";

type Users = ReadonlyMap<string, UserDetails>;

export const EMPTY_QUICK_FILTERS: RiskQuickFilters = {
  riskOwner: "",
  owner: "",
  status: "",
  riskLevel: "",
};

/** The list's Frappe filters: the project, the quick filters, then the complete advanced conditions. */
export function riskListFilters(
  projectId: string,
  quick: RiskQuickFilters,
  advanced: FilterCondition[],
): unknown[][] {
  const filters: unknown[][] = [["project", "=", projectId]];
  if (quick.owner) filters.push(["owner", "=", quick.owner]);
  if (quick.riskOwner) filters.push(["risk_owner", "=", quick.riskOwner]);
  if (quick.status) filters.push(["status", "=", quick.status]);
  if (quick.riskLevel) filters.push(["risk_level", "=", quick.riskLevel]);
  return [...filters, ...buildFilterConditions(advanced)];
}

/** How many quick filters are set, for the Filter button's count. */
export function quickFilterCount(quick: RiskQuickFilters): number {
  return Object.values(quick).filter(Boolean).length;
}

export function riskOrderBy(sort: SortState | null): string {
  const { field, order } = sort ?? DEFAULT_RISK_SORT;
  return `${field} ${order}`;
}

/** The distinct creators and risk owners of the project's risks, in first-seen order. */
export function riskPeople(
  rows: readonly Pick<RiskRow, "owner" | "risk_owner">[],
) {
  const unique = (ids: (string | null)[]) => [
    ...new Set(ids.filter((id): id is string => Boolean(id))),
  ];
  return {
    owners: unique(rows.map((row) => row.owner)),
    riskOwners: unique(rows.map((row) => row.risk_owner)),
  };
}

/** A quick filter's options: "All …" first, then each user by full name. */
export function personFilterOptions(
  allLabel: string,
  userIds: readonly string[],
  users: Users,
) {
  return [
    { label: allLabel, value: "" },
    ...userIds.map((userId) => ({
      label: users.get(userId)?.full_name || userId,
      value: userId,
    })),
  ];
}

export function toRiskItems(
  rows: readonly RiskRow[],
  users: Users,
): RiskItem[] {
  return rows.map((row) => ({
    ...row,
    riskOwnerPerson: row.risk_owner
      ? toPerson(row.risk_owner, users.get(row.risk_owner))
      : null,
  }));
}

/** The "Open Risk" and "Mitigated Risk" groups; a risk without a status is open. */
export function riskGroups(
  items: readonly RiskItem[],
): RecordGroup<RiskItem, RiskColumnKey>[] {
  return [
    {
      value: "open",
      label: "Open Risk",
      columns: RISK_COLUMNS,
      rows: items.filter((item) => item.status !== MITIGATED_STATUS),
    },
    {
      value: "mitigated",
      label: "Mitigated Risk",
      columns: RISK_COLUMNS,
      rows: items.filter((item) => item.status === MITIGATED_STATUS),
    },
  ];
}

/** "{category} Risk", or the risk's ID when it has no category. */
export function riskTitle(risk: Pick<RiskRow, "name" | "risk_category">) {
  return risk.risk_category ? `${risk.risk_category} Risk` : risk.name;
}

/** A summary as one line of text for the list. */
export function summaryText(summary: string | null): string {
  return stripTags(summary || "—") || "—";
}

/** The updates newest first, with their authors. */
export function riskUpdateItems(
  updates: readonly RiskUpdate[],
  users: Users,
): RiskUpdateItem[] {
  return newestFirst(updates).map((update) => ({
    ...update,
    author: toPerson(
      update.updated_by ?? "",
      users.get(update.updated_by ?? ""),
    ),
  }));
}

/** The users a risk's detail shows: its creator, owner and update authors. */
export function riskDetailUserIds(risk: RiskDoc | null): string[] {
  if (!risk) return [];
  return [
    risk.owner,
    risk.risk_owner ?? "",
    ...(risk.risk_update_log ?? []).map((update) => update.updated_by ?? ""),
  ].filter(Boolean);
}

/** The dialog's values: the risk's, or a new risk's owned by the project manager. */
export function riskForm(
  risk: RiskDoc | null,
  projectManagerId = "",
): RiskForm {
  return {
    risk_category: risk?.risk_category ?? "",
    risk_level: risk?.risk_level ?? "",
    status: risk?.status ?? "",
    risk_owner: risk ? (risk.risk_owner ?? "") : projectManagerId,
    summary: risk?.summary ?? "",
    mitigation_plan: risk?.mitigation_plan ?? "",
  };
}

/** A new risk needs a level and a status; an edit doesn't change them. */
export function validateRiskForm(
  form: RiskForm,
  editing: boolean,
): RiskFormErrors {
  if (editing) return {};
  const errors: RiskFormErrors = {};
  if (!form.risk_level.trim())
    errors.risk_level = "Please select a risk level.";
  if (!form.status.trim()) errors.status = "Please select a status.";
  return errors;
}

/** Editor HTML with no visible text becomes empty. */
function richText(html: string): string {
  return stripTags(html) ? html : "";
}

/** A new risk; empty optional fields are left out, so the owner defaults on the server. */
export function createRiskPayload(projectId: string, form: RiskForm) {
  const summary = richText(form.summary);
  const plan = richText(form.mitigation_plan);
  return {
    project: projectId,
    ...(form.risk_category && { risk_category: form.risk_category }),
    risk_level: form.risk_level,
    status: form.status,
    ...(form.risk_owner && { risk_owner: form.risk_owner }),
    ...(summary && { summary }),
    ...(plan && { mitigation_plan: plan }),
  };
}

/**
 * An edit's values: category, owner, summary and mitigation plan, cleared ones
 * included. Status and level change only through updates.
 */
export function editRiskPayload(form: RiskForm) {
  return {
    risk_category: form.risk_category || null,
    risk_owner: form.risk_owner,
    summary: richText(form.summary),
    mitigation_plan: richText(form.mitigation_plan),
  };
}

/** The dialog's values: the update's, or a new update's starting from the risk's status and level. */
export function riskUpdateForm(
  risk: Pick<RiskDoc, "status" | "risk_level">,
  update?: RiskUpdate | null,
): RiskUpdateForm {
  const source = update ?? risk;
  return {
    status: source.status ?? "",
    risk_level: source.risk_level ?? "",
    note: update?.note ?? "",
  };
}

export function validateRiskUpdateForm(
  form: RiskUpdateForm,
): Partial<Record<"note", string>> {
  return stripTags(form.note) ? {} : { note: "Note is required." };
}

function updateValues(form: RiskUpdateForm) {
  return {
    ...(form.status && { status: form.status }),
    ...(form.risk_level && { risk_level: form.risk_level }),
  };
}

/** The log with a new update appended; React leaves an empty value out. */
export function addedUpdateLog(risk: RiskDoc, form: RiskUpdateForm) {
  return withAddedUpdate(risk.risk_update_log ?? [], RISK_UPDATE_FIELDS, {
    ...updateValues(form),
    ...(form.note && { note: form.note }),
  });
}

/** The log with the update named `name` changed; an empty status or level keeps the old one. */
export function editedUpdateLog(
  risk: RiskDoc,
  name: string,
  form: RiskUpdateForm,
) {
  return withEditedUpdate(
    risk.risk_update_log ?? [],
    RISK_UPDATE_FIELDS,
    name,
    {
      ...updateValues(form),
      note: form.note,
    },
  );
}

export function deletedUpdateLog(risk: RiskDoc, name: string) {
  return withoutUpdate(risk.risk_update_log ?? [], RISK_UPDATE_FIELDS, name);
}
