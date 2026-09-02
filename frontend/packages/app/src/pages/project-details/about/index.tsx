/**
 * External dependencies.
 */
import { useMatch, useParams } from "react-router";
import { Accordion } from "@base-ui/react/accordion";
import { mergeClassNames } from "@next-pms/design-system";
import { BudgetBurnBar } from "@next-pms/design-system/components";
import { Button, Tooltip } from "@rtcamp/frappe-ui-react";
import { ArrowUpRight } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { currencyFormat } from "@/lib/utils";
import { Dot } from "@/pages/projects/list/cells/dot";
import { ProgressHoursSection } from "./progressHoursSection";
import { Section } from "./section";
import { CustomerSection } from "./sections/customer";
import { LinkSection } from "./sections/link";
import { MemberSection } from "./sections/member";
import { useSidebar } from "./sidebarContext";
import { SidebarProvider } from "./sidebarProvider";
import { useProjectDetail } from "../context";

export function AboutThisProject(props: { className: string }) {
  const editorMatch = useMatch(`${ROUTES.project}/:projectId/notes/*`);
  const { projectId = "" } = useParams<{ projectId: string }>();
  if (editorMatch) return null;
  return (
    <SidebarProvider projectId={projectId}>
      <AboutThisProjectContent {...props} />
    </SidebarProvider>
  );
}

function AboutThisProjectContent({ className }: { className: string }) {
  const projectId = useProjectDetail((state) => state.projectId);
  const currency = useProjectDetail((state) => state.project?.custom_currency);
  const sidebar = useSidebar((state) => state.sidebar);
  const risk = useSidebar((state) => state.risk);

  const costAccrued = currencyFormat(currency).format(
    sidebar.burn.cost_accrued,
  );
  const totalBudget = currencyFormat(currency).format(
    sidebar.burn.total_budget,
  );

  return (
    <section className={mergeClassNames("flex h-full flex-col", className)}>
      <h2 className="h-10 border-b border-outline-gray-1 px-5 py-3 text-lg font-medium text-ink-gray-8 truncate">
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
          <p className="text-base leading-normal text-ink-gray-7">
            {sidebar.summary}
          </p>
        </Section>

        <Section
          value="details"
          title="Project details"
          suffix={
            <Tooltip text="Open in Desk">
              <Button
                className="shrink-0"
                icon={ArrowUpRight}
                label="Open in Desk"
                link={`/desk/project/${encodeURIComponent(projectId)}`}
              />
            </Tooltip>
          }
        >
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-4.5 text-base text-ink-gray-5">
            <span>Project name</span>
            <div className="flex min-w-0 items-center gap-2">
              <Tooltip text={sidebar.details.project_name} showWhen="truncated">
                <span className="flex-1 truncate text-ink-gray-7">
                  {sidebar.details.project_name}
                </span>
              </Tooltip>
              {risk && <Dot risk={risk} />}
            </div>

            <span>Customer</span>

            <Tooltip text={sidebar.details.customer} showWhen="truncated">
              <span className="truncate text-ink-gray-7">
                {sidebar.details.customer}
              </span>
            </Tooltip>

            <span>Project status</span>
            <Tooltip text={sidebar.details.status} showWhen="truncated">
              <span className="truncate text-ink-gray-7">
                {sidebar.details.status}
              </span>
            </Tooltip>

            <span>Current phase</span>
            <Tooltip
              disabled={!sidebar.details.phase}
              text={sidebar.details.phase ?? ""}
              showWhen="truncated"
            >
              <span className="truncate text-ink-gray-7">
                {sidebar.details.phase}
              </span>
            </Tooltip>
          </div>
        </Section>

        <LinkSection />

        <Section value="budget" title="Budget burn">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <Tooltip text={costAccrued} showWhen="truncated">
                <span className="text-base font-medium text-ink-gray-7 truncate">
                  {costAccrued}
                </span>
              </Tooltip>
              <Tooltip text={totalBudget} showWhen="truncated">
                <span className="text-base text-ink-gray-5 truncate">
                  {totalBudget}
                </span>
              </Tooltip>
            </div>
            <BudgetBurnBar
              value={sidebar.burn.cost_accrued}
              primaryTooltip="Cost Accrued"
              secondaryValue={sidebar.burn.cost_forecasted}
              secondaryTooltip="Cost Forcasted"
              markerValue={sidebar.burn.target_cost}
              markerTooltip="Target Cost"
              maxValue={sidebar.burn.total_budget}
            />
          </div>
        </Section>

        <ProgressHoursSection
          progress={{
            consumed: sidebar.progress.actual_time,
            total: sidebar.progress.total_hours_purchased,
          }}
        />

        <MemberSection />

        <CustomerSection />
      </Accordion.Root>
    </section>
  );
}
