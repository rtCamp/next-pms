/**
 * Internal dependencies.
 */
import { AboutSection } from "./aboutSection";
import { BudgetBurnBar } from "./budgetBurnBar";
import type { ProjectBudgetBurn } from "./types";

function formatUsd(value: number): string {
  return `$${value.toLocaleString("en-US")}`;
}

export function BudgetBurnSection({ budget }: { budget: ProjectBudgetBurn }) {
  return (
    <AboutSection value="budget" title="Budget burn">
      <div className="flex flex-col gap-2.5 px-5 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-ink-gray-7">
            {formatUsd(budget.current)}
          </span>
          <span className="text-base font-light text-ink-gray-5">
            {formatUsd(budget.total)}
          </span>
        </div>
        <BudgetBurnBar budget={budget} />
      </div>
    </AboutSection>
  );
}
