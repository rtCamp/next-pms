/**
 * External dependencies.
 */
import { useParams } from "react-router-dom";

/**
 * Internal dependencies.
 */
import { getOverviewData } from "./fake-data";
import { Communication } from "./sections/communication";
import { KeyGoals } from "./sections/key-goals";
import { Marketing } from "./sections/marketing";
import { Sourcing } from "./sections/sourcing";
import { Specifics } from "./sections/specifics";
import { Summary } from "./sections/summary";
import { OverviewSubHeader } from "./sub-header";

export function Overview() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const data = getOverviewData(projectId);

  return (
    <div className="flex flex-col gap-6">
      <OverviewSubHeader />
      <Summary text={data.summary} />
      <KeyGoals html={data.keyGoalsHtml} />
      <Specifics data={data.specifics} />
      <Sourcing data={data.sourcing} />
      <Communication data={data.communication} />
      <Marketing data={data.marketing} />
    </div>
  );
}
