/**
 * External dependencies.
 */
import { useNavigate } from "react-router-dom";
import { Button, Tooltip } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";

import { Dot } from "./dot";
import type { RiskLevel } from "../../types";

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
        className="w-full justify-start font-medium text-base"
      >
        <Dot risk={riskLevel} />
        <span className="ml-2 truncate">{name}</span>
      </Button>
    </Tooltip>
  );
}
