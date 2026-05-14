/**
 * Internal dependencies.
 */
import { pickAllowed } from "@/lib/utils";
import { StagesIcon } from "./stagesIcon";
import { TextCell } from "./textCell";
import { PHASE_LABELS, PHASES } from "../../constants";
import { Phase } from "../../types";

export function PhaseCell({ phase }: { phase?: string }) {
  const _phase = pickAllowed<Phase>(phase, PHASES);

  if (!_phase) {
    return <TextCell text="N/A" />;
  }
  return (
    <div className="flex min-w-0 items-center gap-2 text-ink-gray-7 text-base">
      <StagesIcon phase={_phase} />
      <span className="truncate">{PHASE_LABELS[_phase]}</span>
    </div>
  );
}
