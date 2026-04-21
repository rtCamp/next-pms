/**
 * Internal dependencies.
 */
import { PHASE_LABELS } from "../constants";
import type { Phase } from "../types";

import { StagesIcon } from "./stages-icon";

export function PhaseCell({ phase }: { phase: Phase }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-ink-gray-7">
      <StagesIcon phase={phase} />
      <span className="truncate">{PHASE_LABELS[phase]}</span>
    </div>
  );
}
