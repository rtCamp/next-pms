/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { RagStatus } from "@/pages/projects/types";
import type {
  AboutCustomer,
  AboutMember,
  BillingTeamMember,
  ProjectSidebar,
} from "./types";
import type { ManagerRole } from "../context";

export interface SidebarContextProps {
  sidebar: ProjectSidebar;
  isLoading: boolean;
  mutate: () => void;

  risk: RagStatus | undefined;
  members: AboutMember[];
  teamMembers: AboutMember[];
  billingTeam: BillingTeamMember[];
  customers: AboutCustomer[];
  projectManager: AboutMember | undefined;
  engineeringManager: AboutMember | undefined;
  currentMemberUserIds: string[];
  currentContactIds: string[];
  memberRoleByUserId: Record<string, string[]>;

  addMember: (userId: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateManager: (role: ManagerRole, userId: string | null) => Promise<void>;
  addCustomer: (contactId: string) => Promise<void>;
  removeCustomer: (contactId: string) => Promise<void>;
}

export const DEFAULT_SIDEBAR: ProjectSidebar = {
  summary: "",
  details: { project_name: "", phase: "", status: "", customer: "" },
  links: {
    slack: null,
    google_drive: null,
    website: null,
    github: null,
    opportunity: null,
  },
  burn: { total_budget: 0, cost_accrued: 0, cost_forecasted: 0 },
  progress: { actual_time: 0, total_hours_purchased: 0 },
  members: [],
  customers: [],
  billing_team: [],
};

const noop = () => {};
const asyncNoop = async () => {};

export const SidebarContext = createContext<SidebarContextProps>({
  sidebar: DEFAULT_SIDEBAR,
  isLoading: false,
  mutate: noop,

  risk: undefined,
  members: [],
  teamMembers: [],
  billingTeam: [],
  customers: [],
  projectManager: undefined,
  engineeringManager: undefined,
  currentMemberUserIds: [],
  currentContactIds: [],
  memberRoleByUserId: {},

  addMember: asyncNoop,
  removeMember: asyncNoop,
  updateManager: asyncNoop,
  addCustomer: asyncNoop,
  removeCustomer: asyncNoop,
});

export const useSidebar = <T>(selector: (state: SidebarContextProps) => T) =>
  useContextSelector(SidebarContext, selector);
