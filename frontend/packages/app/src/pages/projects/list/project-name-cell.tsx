/**
 * External dependencies.
 */
import { Button, Tooltip } from "@rtcamp/frappe-ui-react";
import { useNavigate } from "react-router-dom";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";

import { Dot } from "./dot";
import type { RiskLevel } from "./types";

export function ProjectNameCell({
  id,
  name,
  riskLevel,
}: {
  id: string;
  name: string;
  riskLevel: RiskLevel;
}) {
  const navigate = useNavigate();
  return (
    <Tooltip text={name}>
      <Button
        variant="ghost"
        theme="gray"
        size="sm"
        onClick={() => navigate(`${ROUTES.project}/${id}`)}
        className="w-full justify-start font-medium"
      >
        <Dot risk={riskLevel} />
        <span className="truncate">{name}</span>
      </Button>
    </Tooltip>
  );
}
