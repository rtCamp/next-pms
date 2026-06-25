/**
 * External dependencies.
 */
import { useMatch, useParams } from "react-router-dom";
import { Accordion } from "@base-ui/react/accordion";
import { mergeClassNames } from "@next-pms/design-system";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { currencyFormat } from "@/lib/utils";
import { Dot } from "@/pages/projects/list/cells/dot";
import { BudgetBurnBar } from "./components/budgetBurnBar";
import { ProgressHoursSection } from "./progressHoursSection";
import { Section } from "./section";
import { CustomerSection } from "./sections/customer";
import { LinkSection } from "./sections/link";
import { MemberSection } from "./sections/member";
import { useSidebar } from "./sidebarContext";
import { SidebarProvider } from "./sidebarProvider";

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
  const sidebar = useSidebar((state) => state.sidebar);
  const risk = useSidebar((state) => state.risk);

  return (
    <section className={mergeClassNames("flex h-full flex-col", className)}>
      <h2 className="h-10 border-b border-outline-gray-1 px-5 py-3 text-lg font-medium text-ink-gray-8">
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

        <Section value="details" title="Project details">
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-4.5 text-base text-ink-gray-5">
            <span>Project name</span>
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex-1 truncate text-ink-gray-7">
                {sidebar.details.project_name}
              </span>
              {risk && <Dot risk={risk} />}
            </div>

            <span>Customer</span>
            <span className="truncate text-ink-gray-7">
              {sidebar.details.customer}
            </span>

            <span>Project status</span>
            <span className="truncate text-ink-gray-7">
              {sidebar.details.status}
            </span>

            <span>Current phase</span>
            <span className="truncate text-ink-gray-7">
              {sidebar.details.phase}
            </span>
          </div>
        </Section>

        <LinkSection />

        <Section value="budget" title="Budget burn">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-ink-gray-7">
                {currencyFormat().format(sidebar.burn.cost_accrued)}
              </span>
              <span className="text-base text-ink-gray-5">
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

        <MemberSection />

        <CustomerSection />
      </Accordion.Root>
    </section>
  );
}
