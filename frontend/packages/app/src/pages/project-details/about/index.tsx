/**
 * External dependencies.
 */
import { useParams } from "react-router-dom";
import { Accordion } from "@base-ui/react/accordion";
import { mergeClassNames } from "@next-pms/design-system";
import { Button } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { pickAllowed, toKebabCase } from "@/lib/utils";
import { RAG_STATUS } from "@/pages/projects/constants";
import { Dot } from "@/pages/projects/list/cells/dot";
import { RagStatus } from "@/pages/projects/types";
import { BudgetBurnBar } from "./components/budgetBurnBar";
import { CustomerRow } from "./components/customerRow";
import { ExpandableList } from "./components/expandableList";
import { MemberRow } from "./components/memberRow";
import { getProjectAboutData } from "./fake-data";
import { ProgressHoursSection } from "./progressHoursSection";
import { Section } from "./section";
import { useProjectDetail } from "../context";

export function AboutThisProject({ className }: { className: string }) {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const about = getProjectAboutData(projectId);

  const summary = useProjectDetail(
    (state) => state.project?.custom_short_summary ?? "",
  );

  const projectName = useProjectDetail(
    (state) => state.project?.project_name ?? "",
  );

  const customer = useProjectDetail((state) => state.project?.customer ?? "");

  const risk = useProjectDetail((state) =>
    pickAllowed<RagStatus>(
      toKebabCase(state.project?.custom_project_rag_status),
      RAG_STATUS,
    ),
  );
  console.log(risk);

  const status = useProjectDetail((state) => state.project?.status ?? "");

  const phase = useProjectDetail(
    (state) => state.project?.custom_project_phase ?? "",
  );

  return (
    <section className={mergeClassNames("flex h-full flex-col", className)}>
      <h2 className="border-b border-outline-gray-1 px-5 py-3 text-lg font-medium text-ink-gray-9">
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
        className="flex flex-col"
      >
        <Section value="summary" title="Summary">
          <p className="text-base font-normal text-ink-gray-7">{summary}</p>
        </Section>

        <Section value="details" title="Project details">
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-4.5 text-base font-light text-ink-gray-5">
            <span>Project name</span>
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex-1 truncate text-ink-gray-7">
                {projectName}
              </span>
              {risk && <Dot risk={risk} />}
            </div>

            <span>Customer</span>
            <span className="truncate text-ink-gray-7">{customer}</span>

            <span>Project status</span>
            <span className="truncate text-ink-gray-7">{status}</span>

            <span>Current phase</span>
            <span className="truncate text-ink-gray-7">{phase}</span>
          </div>
        </Section>

        <Section value="links" title="Links">
          <div className="flex items-center gap-2">
            {about.links.map(({ key, label, href, icon: Icon }) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                title={label}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-gray-2 text-ink-gray-7 transition-colors hover:bg-surface-gray-3"
              >
                <Icon aria-hidden className="size-[18px]" />
              </a>
            ))}
          </div>
        </Section>

        <Section value="budget" title="Budget burn">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-ink-gray-7">
                {about.budget.current}
              </span>
              <span className="text-base font-light text-ink-gray-5">
                {about.budget.total}
              </span>
            </div>
            <BudgetBurnBar budget={about.budget} />
          </div>
        </Section>

        <ProgressHoursSection progress={about.progress} />

        <Section
          value="members"
          title="Members"
          suffix={
            <Button
              icon={AddSm}
              aria-label="Add member"
              onClick={() => {
                // @todo: open the Add member flow once that's wired (Issue #1227 AC: TBD).
              }}
            />
          }
        >
          <ExpandableList
            items={about.members}
            itemLabel="members"
            getKey={(member) => member.email}
            renderItem={(member) => <MemberRow member={member} />}
          />
        </Section>

        <Section
          value="customers"
          title="Customers"
          suffix={
            <Button
              icon={AddSm}
              aria-label="Add customer"
              onClick={() => {
                // @todo: open the Add customer flow once that's wired (Issue #1227 AC: TBD).
              }}
            />
          }
        >
          <ExpandableList
            items={about.customers}
            itemLabel="customers"
            getKey={(customer) => customer.email}
            renderItem={(customer) => <CustomerRow customer={customer} />}
          />
        </Section>
      </Accordion.Root>
    </section>
  );
}
