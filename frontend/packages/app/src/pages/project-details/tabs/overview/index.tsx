/**
 * Internal dependencies.
 */
import { Communication } from "./sections/communication";
import { KeyGoals } from "./sections/keyGoals";
import { Marketing } from "./sections/marketing";
import { Sourcing } from "./sections/sourcing";
import { Specifics } from "./sections/specifics";
import { Summary } from "./sections/summary";
import { OverviewSubHeader } from "./sub-header";

export function Overview() {
  return (
    <div className="flex flex-col gap-6">
      <OverviewSubHeader />
      <Summary />
      <KeyGoals />
      <Specifics />
      <Sourcing />
      <Communication />
      <Marketing />
    </div>
  );
}
