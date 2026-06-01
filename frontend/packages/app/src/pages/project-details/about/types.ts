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
  employee: string;
  email: string;
  designation: string;
  department?: string;
  image?: string;
  phone?: string;
  rate?: number;
  currency?: string;
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

export type ProjectSidebar = {
  summary: string | null;
  details: {
    project_name: string;
    phase: string | null;
    status: string;
    customer: string | null;
  };
  links: {
    slack: string | null;
    google_drive: string | null;
    website: string | null;
    github: string | null;
    opportunity: { name: string; url: string } | null;
  };
  burn: {
    total_budget: number;
    cost_accrued: number;
    cost_forecasted: number;
  };
  progress: {
    actual_time: number;
    total_hours_purchased: number;
  };
  members: Array<{
    user: string;
    employee: string;
    full_name: string;
    image: string | null;
    designation: string | null;
    department: string | null;
    cell_number: string | null;
    company_email: string | null;
    hourly_rate: number | null;
    currency: string | null;
  }>;
  customers: Array<{
    contact: string;
    full_name: string;
    image: string | null;
    designation: string | null;
    company_name: string | null;
    email_id: string | null;
    phone: string | null;
  }>;
};

export type ProjectSidebarResponse = { message: ProjectSidebar };
