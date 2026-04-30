/**
 * External dependencies.
 */
import type { ComponentType, SVGProps } from "react";

/**
 * Internal dependencies.
 */
import type { EmployeeRef } from "@/pages/projects/list/types";

export type ProjectLinkKey =
  | "website"
  | "files"
  | "github"
  | "people"
  | "support";

export type ProjectLink = {
  key: ProjectLinkKey;
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export type AboutMember = EmployeeRef & {
  designation: string;
  phone?: string;
  avatarColor: string;
};

export type AboutCustomer = {
  name: string;
  email: string;
  company: string;
  href?: string;
  initials: string;
  avatarColor: string;
};

export type ProjectBudgetBurn = {
  current: number;
  total: number;
  projected?: number;
};

export type ProjectProgressHours = {
  consumed: number;
  total: number;
};

export type ProjectAboutData = {
  summary: string;
  status: string;
  links: ProjectLink[];
  budget: ProjectBudgetBurn;
  progress: ProjectProgressHours;
  members: AboutMember[];
  customers: AboutCustomer[];
};
