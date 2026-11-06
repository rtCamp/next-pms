/** A person the project is shared with, as `get_project_sidebar` returns them. */
export interface SidebarMember {
  user: string;
  employee: string | null;
  full_name: string;
  image: string | null;
  designation: string | null;
  department: string | null;
  cell_number: string | null;
  company_email: string | null;
  linkedin_url?: string | null;
  hourly_rate: number | null;
  logged_hours?: number | null;
  currency: string | null;
  /** `"Project Manager"` and / or `"Engineering Manager"`. */
  project_roles: string[];
}

/** A customer contact, as `get_project_sidebar` returns them. */
export interface SidebarCustomer {
  contact: string;
  full_name: string;
  image: string | null;
  designation: string | null;
  company_name: string | null;
  email_id: string | null;
  phone: string | null;
  linkedin_url?: string | null;
}

/** The response of `get_project_sidebar`. */
export interface ProjectSidebar {
  summary: string | null;
  details: {
    company: string | null;
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
    target_cost: number;
  };
  progress: {
    actual_time: number;
    total_hours_purchased: number;
  };
  members: SidebarMember[];
  customers: SidebarCustomer[];
  /** Time and Material projects only. */
  billing_team: {
    name: string | null;
    employee_id: string;
    user_id: string | null;
  }[];
  is_shared_with_everyone: boolean;
}

/** A member as the sidebar shows them. */
export interface AboutMember {
  userId: string;
  name: string;
  designation?: string;
  department?: string;
  image?: string;
  phone?: string;
  /** Hourly cost from the member's salary, in the project currency. */
  rate?: number;
  email?: string;
  linkedin?: string;
  loggedHours?: number;
  totalHoursPurchased: number;
  projectRoles: string[];
}

/** A customer contact as the sidebar shows them. */
export interface AboutCustomer {
  contactId: string;
  name: string;
  designation?: string;
  company?: string;
  email?: string;
  image?: string;
  phone?: string;
  linkedin?: string;
}

export type ManagerRole = "project_manager" | "engineering_manager";
