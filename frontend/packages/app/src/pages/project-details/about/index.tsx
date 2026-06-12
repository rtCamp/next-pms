/**
 * External dependencies.
 */
import { useMemo, useState } from "react";
import { useMatch, useParams } from "react-router-dom";
import { Accordion } from "@base-ui/react/accordion";
import { mergeClassNames } from "@next-pms/design-system";
import { Github } from "@next-pms/design-system/components";
import { Button } from "@rtcamp/frappe-ui-react";
import {
  AddSm,
  Hashtag,
  SolidExternalLink,
  SolidSharedFolder,
} from "@rtcamp/frappe-ui-react/icons";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { currencyFormat, pickAllowed, toKebabCase } from "@/lib/utils";
import { RAG_STATUS } from "@/pages/projects/constants";
import { Dot } from "@/pages/projects/list/cells/dot";
import { RagStatus } from "@/pages/projects/types";
import { AddCustomerModal } from "./components/addCustomerModal";
import { AddMemberModal } from "./components/addMemberModal";
import { BudgetBurnBar } from "./components/budgetBurnBar";
import { CustomerRow } from "./components/customerRow";
import { ExpandableList } from "./components/expandableList";
import { MemberRoleRow } from "./components/memberRoleRow";
import { MemberRow } from "./components/memberRow";
import { ProgressHoursSection } from "./progressHoursSection";
import { Section } from "./section";
import type {
  AboutCustomer,
  AboutMember,
  ProjectSidebar,
  ProjectSidebarResponse,
} from "./types";
import { useProjectDetail } from "../context";

const DEFAULT_SIDEBAR: ProjectSidebar = {
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
};

export function AboutThisProject(props: { className: string }) {
  const editorMatch = useMatch(`${ROUTES.project}/:projectId/notes/*`);
  if (editorMatch) return null;
  return <AboutThisProjectContent {...props} />;
}

function AboutThisProjectContent({ className }: { className: string }) {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);

  const { data, mutate: mutateSidebar } =
    useFrappeGetCall<ProjectSidebarResponse>(
      "next_pms.next_projects.api.project.get_project_sidebar",
      {
        project: projectId,
      },
    );

  const sidebar = data?.message || DEFAULT_SIDEBAR;

  const risk = useProjectDetail((state) =>
    pickAllowed<RagStatus>(
      toKebabCase(state.project?.custom_project_rag_status),
      RAG_STATUS,
    ),
  );

  const updateContacts = useProjectDetail((state) => state.updateContacts);
  const addMember = useProjectDetail((state) => state.addMember);
  const removeMember = useProjectDetail((state) => state.removeMember);

  const currentMemberUserIds = useMemo(
    () => sidebar.members.map((m) => m.user),
    [sidebar.members],
  );

  const handleAddMember = async (userId: string) => {
    if (currentMemberUserIds.includes(userId)) return;
    await addMember(userId);
    mutateSidebar();
  };

  const handleRemoveMember = async (userId: string) => {
    await removeMember(userId);
    mutateSidebar();
  };

  const currentContactIds = useMemo(
    () => sidebar.customers.map((c) => c.contact),
    [sidebar.customers],
  );

  const handleAddCustomer = async (contactId: string) => {
    if (currentContactIds.includes(contactId)) return;
    await updateContacts([...currentContactIds, contactId]);
    mutateSidebar();
  };

  const handleRemoveCustomer = async (contactId: string) => {
    await updateContacts(currentContactIds.filter((id) => id !== contactId));
    mutateSidebar();
  };

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
        projectRole: m.project_role ?? undefined,
        totalHoursPurchased: sidebar.progress.total_hours_purchased,
      })),
    [sidebar.members, sidebar.progress.total_hours_purchased],
  );

  const projectManager = members.find(
    (m) => m.projectRole === "Project Manager",
  );
  const engineeringManager = members.find(
    (m) => m.projectRole === "Engineering Manager",
  );

  const memberRoleByUserId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of members) {
      if (m.projectRole) map[m.email] = m.projectRole;
    }
    return map;
  }, [members]);

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

  return (
    <section className={mergeClassNames("flex h-full flex-col", className)}>
      <h2 className="h-10 border-b border-outline-gray-1 px-5 py-3 text-lg font-medium text-ink-gray-9">
        About this project
      </h2>
      <Accordion.Root
        multiple
        defaultValue={[
          "summary",
          "details",
          "links",
          "budget",
          "progress",
          "members",
          "customers",
        ]}
        className="flex flex-col overflow-scroll scrollbar-thin"
      >
        <Section value="summary" title="Summary" empty={!sidebar.summary}>
          <p className="text-base font-normal text-ink-gray-7">
            {sidebar.summary}
          </p>
        </Section>

        <Section value="details" title="Project details">
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-4.5 text-base font-light text-ink-gray-5">
            <span>Project name</span>
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex-1 truncate font-medium text-ink-gray-7">
                {sidebar.details.project_name}
              </span>
              {risk && <Dot risk={risk} />}
            </div>

            <span>Customer</span>
            <span className="truncate font-medium text-ink-gray-7">
              {sidebar.details.customer}
            </span>

            <span>Project status</span>
            <span className="truncate font-medium text-ink-gray-7">
              {sidebar.details.status}
            </span>

            <span>Current phase</span>
            <span className="truncate font-medium text-ink-gray-7">
              {sidebar.details.phase}
            </span>
          </div>
        </Section>

        <Section
          value="links"
          title="Links"
          empty={
            !sidebar.links.website &&
            !sidebar.links.google_drive &&
            !sidebar.links.slack &&
            !sidebar.links.github
          }
        >
          <div className="flex items-center gap-2">
            {sidebar.links.website && (
              <a
                href={sidebar.links.website}
                target="_blank"
                rel="noreferrer"
                aria-label="Project website"
                className="flex h-7 w-7 items-center justify-center rounded text-ink-gray-7 bg-surface-gray-2 hover:bg-surface-gray-4"
              >
                <SolidExternalLink className="h-4 w-4" />
              </a>
            )}
            {sidebar.links.google_drive && (
              <a
                href={sidebar.links.google_drive}
                target="_blank"
                rel="noreferrer"
                aria-label="Drive folder"
                className="flex h-7 w-7 items-center justify-center rounded text-ink-gray-7 bg-surface-gray-2 hover:bg-surface-gray-4"
              >
                <SolidSharedFolder className="h-4 w-4" />
              </a>
            )}
            {sidebar.links.slack && (
              <a
                href={sidebar.links.slack}
                target="_blank"
                rel="noreferrer"
                aria-label="Slack channel"
                className="flex h-7 w-7 items-center justify-center rounded text-ink-gray-7 bg-surface-gray-2 hover:bg-surface-gray-4"
              >
                <Hashtag className="h-4 w-4" />
              </a>
            )}
            {sidebar.links.github && (
              <a
                href={sidebar.links.github}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub repository"
                className="flex h-7 w-7 items-center justify-center rounded text-ink-gray-7 bg-surface-gray-2 hover:bg-surface-gray-4"
              >
                <Github className="h-4 w-4" />
              </a>
            )}
          </div>
        </Section>

        <Section value="budget" title="Budget burn">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-ink-gray-7">
                {currencyFormat().format(sidebar.burn.cost_accrued)}
              </span>
              <span className="text-base font-light text-ink-gray-5">
                {currencyFormat().format(sidebar.burn.total_budget)}
              </span>
            </div>
            <BudgetBurnBar
              budget={{
                current: sidebar.burn.cost_accrued,
                total: sidebar.burn.total_budget,
                projected: sidebar.burn.cost_forecasted,
              }}
            />
          </div>
        </Section>

        <ProgressHoursSection
          progress={{
            consumed: sidebar.progress.actual_time,
            total: sidebar.progress.total_hours_purchased,
          }}
        />

        <Section
          value="members"
          title="Members"
          suffix={
            <Button
              icon={AddSm}
              aria-label="Add member"
              onClick={() => setAddMemberOpen(true)}
            />
          }
        >
          {(projectManager || engineeringManager) && (
            <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-4.5 text-base font-light text-ink-gray-5 mb-4">
              {projectManager && (
                <MemberRoleRow
                  label="Project Manager"
                  member={projectManager}
                />
              )}
              {engineeringManager && (
                <MemberRoleRow
                  label="Lead Engineer"
                  member={engineeringManager}
                />
              )}
            </div>
          )}

          <h3 className="mb-2 text-base font-medium text-ink-gray-8">
            Team members
          </h3>
          {members.filter(
            (m) =>
              m.projectRole !== "Project Manager" &&
              m.projectRole !== "Engineering Manager",
          ).length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-gray-4">
              No Members
            </p>
          ) : (
            <ExpandableList
              items={members.filter(
                (m) =>
                  m.projectRole !== "Project Manager" &&
                  m.projectRole !== "Engineering Manager",
              )}
              itemLabel="members"
              getKey={(member) => member.email}
              renderItem={(member) => <MemberRow member={member} />}
            />
          )}
        </Section>

        <Section
          value="customers"
          title="Customers"
          suffix={
            <Button
              icon={AddSm}
              aria-label="Add customer"
              onClick={() => setAddCustomerOpen(true)}
            />
          }
        >
          <ExpandableList
            items={customers}
            itemLabel="customers"
            getKey={(customer) => customer.email ?? customer.name ?? ""}
            renderItem={(customer) => <CustomerRow customer={customer} />}
          />
        </Section>
      </Accordion.Root>
      <AddMemberModal
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        currentMemberIds={currentMemberUserIds}
        memberRoleByUserId={memberRoleByUserId}
        onAdd={handleAddMember}
        onRemove={handleRemoveMember}
      />
      <AddCustomerModal
        open={addCustomerOpen}
        onOpenChange={setAddCustomerOpen}
        customer={sidebar.details.customer ?? ""}
        currentCustomerIds={currentContactIds}
        onAdd={handleAddCustomer}
        onRemove={handleRemoveCustomer}
      />
    </section>
  );
}
