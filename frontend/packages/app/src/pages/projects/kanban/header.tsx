/**
 * External dependencies.
 */
import { Button } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { StagesIcon } from "../list/cells/stagesIcon";
import { PHASE_LABELS } from "../list/constants";
import type { Phase } from "../types";

export function Header({ phase }: { phase: Phase }) {
  return (
    <div className="flex items-center gap-2 pl-1.5">
      <StagesIcon phase={phase} />
      <span className="min-w-0 flex-1 truncate text-base text-ink-gray-7">
        {PHASE_LABELS[phase]}
      </span>
      <Button variant="ghost" theme="gray" size="sm" icon={AddSm} />
    </div>
  );
}
