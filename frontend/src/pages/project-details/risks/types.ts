import type {
  Person,
  UpdateLogRow,
} from "@/pages/project-details/shared/types";

/** A `Risk` as the list reads it. */
export interface RiskRow {
  name: string;
  project: string;
  /** A `Risk Category` name. */
  risk_category: string | null;
  /** A `Risk Level` name, e.g. "High". */
  risk_level: string | null;
  /** A `Risk Status` name, e.g. "Blocked". */
  status: string | null;
  /** HTML. */
  summary: string | null;
  /** The user who created it. */
  owner: string;
  /** The user responsible for it; the project manager when created without one. */
  risk_owner: string | null;
}

/** A row of a risk's `risk_update_log`. */
export interface RiskUpdate extends UpdateLogRow {
  name: string;
  status?: string | null;
  risk_level?: string | null;
  idx?: number;
}

/** A whole `Risk`, as the detail reads it. */
export interface RiskDoc extends RiskRow {
  modified: string;
  /** HTML. */
  mitigation_plan: string | null;
  risk_update_log?: RiskUpdate[];
}

/** A risk in the list, with its people. */
export interface RiskItem extends RiskRow {
  riskOwnerPerson: Person | null;
}

/** An update as the detail shows it. */
export interface RiskUpdateItem extends RiskUpdate {
  author: Person;
}

/** The toolbar's quick filters; `""` is "All". */
export interface RiskQuickFilters {
  riskOwner: string;
  owner: string;
  status: string;
  riskLevel: string;
}

/** The Create / Edit risk dialog's values. */
export interface RiskForm {
  risk_category: string;
  risk_level: string;
  status: string;
  /** A user ID. */
  risk_owner: string;
  /** HTML. */
  summary: string;
  /** HTML. */
  mitigation_plan: string;
}

export type RiskFormErrors = Partial<Record<"risk_level" | "status", string>>;

/** The Add / Edit update dialog's values. */
export interface RiskUpdateForm {
  status: string;
  risk_level: string;
  /** HTML. */
  note: string;
}
