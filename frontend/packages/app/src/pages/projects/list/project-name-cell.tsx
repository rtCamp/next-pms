/**
 * External dependencies.
 */
import { Tooltip } from "@rtcamp/frappe-ui-react";
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
  const href = `${ROUTES.base}${ROUTES.project}/${id}`;
  return (
    <Tooltip text={name}>
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          navigate(`${ROUTES.project}/${id}`);
        }}
        className="flex min-w-0 items-center gap-2"
      >
        <Dot risk={riskLevel} />
        <span className="truncate font-medium text-ink-gray-8">{name}</span>
      </a>
    </Tooltip>
  );
}
