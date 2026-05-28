/**
 * External dependencies.
 */
import type { ComponentType, SVGProps } from "react";

/**
 * Internal dependencies.
 */

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

export type AboutMember = {
  name: string;
  email: string;
  designation: string;
  image?: string;
  phone?: string;
  rate?: number;
  companyEmail?: string;
};

export type AboutCustomer = {
  name?: string;
  designation?: string;
  company?: string;
  email?: string;
  href?: string;
  image?: string;
  phone?: string;
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
