/**
 * External dependencies.
 */
import { useCallback, useMemo } from "react";
import type { PropsWithChildren } from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import {
  useFrappeGetCall,
  useFrappePostCall,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { pickAllowed, toKebabCase } from "@/lib/utils";
import { RAG_STATUS } from "@/pages/projects/constants";
import type { RagStatus } from "@/pages/projects/types";
import {
  DEFAULT_SIDEBAR,
  SidebarContext,
  type SidebarContextProps,
} from "./sidebarContext";
import type {
  AboutCustomer,
  AboutMember,
  BillingTeamMember,
  ProjectSidebarResponse,
} from "./types";
import { useProjectDetail } from "../context";
import type { ManagerRole } from "../context";

const PROJECT_MANAGER_ROLE = "Project Manager";
const ENGINEERING_MANAGER_ROLE = "Engineering Manager";

interface SidebarProviderProps extends PropsWithChildren {
  projectId: string;
}

export function SidebarProvider({ projectId, children }: SidebarProviderProps) {
  const {
    data,
    isLoading,
    mutate: mutateSidebar,
  } = useFrappeGetCall<ProjectSidebarResponse>(
    "next_pms.next_projects.api.project.get_project_sidebar",
    {
      project: projectId,
    },
  );

  const sidebar = data?.message ?? DEFAULT_SIDEBAR;

  const toast = useToasts();
  const { updateDoc } = useFrappeUpdateDoc();
  const { call: shareAdd } = useFrappePostCall("frappe.share.add");
  const { call: shareSetPermission } = useFrappePostCall(
    "frappe.share.set_permission",
  );

  const project = useProjectDetail((state) => state.project);
  const mutateProject = useProjectDetail((state) => state.mutate);
  const updateContactsDoc = useProjectDetail((state) => state.updateContacts);

  const risk = useProjectDetail((state) =>
    pickAllowed<RagStatus>(
      toKebabCase(state.project?.custom_project_rag_status),
      RAG_STATUS,
    ),
  );

  const members = useMemo<AboutMember[]>(
    () =>
      sidebar.members.map((m) => ({
        name: m.full_name,
        employee: m.employee,
        email: m.user,
        designation: m.designation ?? "",
        department: m.department ?? undefined,
        image: m.image ?? undefined,
        phone: m.cell_number ?? undefined,
        rate: m.hourly_rate ?? undefined,
        currency: m.currency ?? undefined,
        companyEmail: m.company_email ?? undefined,
        linkedin: m.linkedin_url ?? undefined,
        loggedHours: m.logged_hours ?? undefined,
        projectRoles: m.project_roles ?? [],
        totalHoursPurchased: sidebar.progress.total_hours_purchased,
      })),
    [sidebar.members, sidebar.progress.total_hours_purchased],
  );

  const customers = useMemo<AboutCustomer[]>(
    () =>
      sidebar.customers.map((c) => ({
        name: c.full_name,
        email: c.email_id ?? undefined,
        designation: c.designation ?? undefined,
        company: c.company_name ?? undefined,
        image: c.image ?? undefined,
        phone: c.phone ?? undefined,
        href: `/desk/contact/${encodeURIComponent(c.contact)}`,
        linkedin: c.linkedin_url ?? undefined,
      })),
    [sidebar.customers],
  );

  const billingTeam = useMemo<BillingTeamMember[]>(
    () =>
      sidebar.billing_team.map((m) => ({
        name: m.name,
        employeeId: m.employee_id,
        userId: m.user_id,
      })),
    [sidebar.billing_team],
  );

  const billingTeamUserIds = useMemo(
    () =>
      new Set(
        billingTeam.map((m) => m.userId).filter((id): id is string => !!id),
      ),
    [billingTeam],
  );

  const currentMemberUserIds = useMemo(
    () => sidebar.members.map((m) => m.user),
    [sidebar.members],
  );

  const currentContactIds = useMemo(
    () => sidebar.customers.map((c) => c.contact),
    [sidebar.customers],
  );

  const projectManager = useMemo(
    () => members.find((m) => m.projectRoles.includes("Project Manager")),
    [members],
  );

  const engineeringManager = useMemo(
    () => members.find((m) => m.projectRoles.includes("Engineering Manager")),
    [members],
  );

  const teamMembers = useMemo(
    () =>
      members.filter(
        (m) =>
          !m.projectRoles.includes(PROJECT_MANAGER_ROLE) &&
          !m.projectRoles.includes(ENGINEERING_MANAGER_ROLE),
      ),
    [members],
  );

  const memberRoleByUserId = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const m of members) {
      if (m.projectRoles.length) map[m.email] = m.projectRoles;
    }
    return map;
  }, [members]);

  const addMember = useCallback(
    async (userId: string) => {
      if (currentMemberUserIds.includes(userId)) return;
      await shareAdd({
        doctype: "Project",
        name: projectId,
        user: userId,
        notify: 1,
        read: 1,
        write: 0,
        submit: 0,
        share: 0,
      });
      mutateProject();
      mutateSidebar();
    },
    [currentMemberUserIds, shareAdd, projectId, mutateProject, mutateSidebar],
  );

  const removeMember = useCallback(
    async (userId: string) => {
      await shareSetPermission({
        doctype: "Project",
        name: projectId,
        user: userId,
        permission_to: "read",
        value: 0,
        everyone: 0,
      });
      mutateProject();
      mutateSidebar();
    },
    [shareSetPermission, projectId, mutateProject, mutateSidebar],
  );

  const updateManager = useCallback(
    async (role: ManagerRole, userId: string | null) => {
      if (userId && billingTeamUserIds.has(userId)) {
        toast.error("Billing team members cannot be assigned as a manager");
        return;
      }

      const fieldname =
        role === "project_manager"
          ? "custom_project_manager"
          : "custom_engineering_manager";
      const previousUserId =
        role === "project_manager"
          ? project?.custom_project_manager
          : project?.custom_engineering_manager;
      const otherManagerUserId =
        role === "project_manager"
          ? project?.custom_engineering_manager
          : project?.custom_project_manager;

      await updateDoc("Project", projectId, { [fieldname]: userId ?? "" });

      if (userId) {
        await addMember(userId);
      }
      if (
        previousUserId &&
        previousUserId !== userId &&
        previousUserId !== otherManagerUserId
      ) {
        await removeMember(previousUserId);
      }

      mutateProject();
      mutateSidebar();
    },
    [
      updateDoc,
      projectId,
      project,
      addMember,
      removeMember,
      mutateProject,
      mutateSidebar,
      billingTeamUserIds,
      toast,
    ],
  );

  const addCustomer = useCallback(
    async (contactId: string) => {
      if (currentContactIds.includes(contactId)) return;
      await updateContactsDoc([...currentContactIds, contactId]);
      mutateSidebar();
    },
    [currentContactIds, updateContactsDoc, mutateSidebar],
  );

  const removeCustomer = useCallback(
    async (contactId: string) => {
      await updateContactsDoc(
        currentContactIds.filter((id) => id !== contactId),
      );
      mutateSidebar();
    },
    [currentContactIds, updateContactsDoc, mutateSidebar],
  );

  const value: SidebarContextProps = {
    sidebar,
    isLoading,
    mutate: mutateSidebar,
    risk,
    members,
    teamMembers,
    billingTeam,
    customers,
    projectManager,
    engineeringManager,
    currentMemberUserIds,
    currentContactIds,
    memberRoleByUserId,
    addMember,
    removeMember,
    updateManager,
    addCustomer,
    removeCustomer,
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}
