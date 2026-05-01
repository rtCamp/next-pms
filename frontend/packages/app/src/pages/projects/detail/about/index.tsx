/**
 * External dependencies.
 */
import { Accordion } from "@base-ui/react/accordion";
import { useParams } from "react-router-dom";

/**
 * Internal dependencies.
 */
import { FAKE_PROJECTS } from "@/pages/projects/list/fake-data";
import { BudgetBurnSection } from "./budgetBurnSection";
import { CustomersSection } from "./customersSection";
import { getProjectAboutData } from "./fake-data";
import { LinksSection } from "./linksSection";
import { MembersSection } from "./membersSection";
import { ProgressHoursSection } from "./progressHoursSection";
import { ProjectDetailsSection } from "./projectDetailsSection";
import { SummarySection } from "./summarySection";

export function AboutThisProject() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const project = FAKE_PROJECTS.find((p) => p.id === projectId)!;
  const about = getProjectAboutData(projectId);

  return (
    <section className="flex h-full flex-col">
      <header className="border-b border-outline-gray-1 px-5 py-3">
        <h2 className="text-base font-medium text-ink-gray-8">
          About this project
        </h2>
      </header>
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
        <SummarySection summary={about.summary} />
        <ProjectDetailsSection project={project} />
        <LinksSection links={about.links} />
        <BudgetBurnSection budget={about.budget} />
        <ProgressHoursSection progress={about.progress} />
        <MembersSection members={about.members} />
        <CustomersSection customers={about.customers} />
      </Accordion.Root>
    </section>
  );
}
