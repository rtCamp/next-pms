/**
 * External dependencies.
 */
import { useNavigate } from "react-router-dom";
import { Button, Tooltip } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { Dot, DotProps } from "./dot";

export function ProjectNameCell({
  id,
  name,
  riskLevel,
}: {
  id: string;
  name: string;
  riskLevel?: string;
}) {
  const navigate = useNavigate();

  const risk: DotProps["risk"] =
    riskLevel === "Red" || riskLevel === "Amber" || riskLevel === "Green"
      ? riskLevel
      : undefined;

  return (
    <Tooltip text={name}>
      <Button
        variant="ghost"
        theme="gray"
        size="sm"
        onClick={() => navigate(`${ROUTES.project}/${id}`)}
        className="w-full justify-start font-medium text-base px-0"
      >
        {risk && <Dot risk={risk} />}
        <span className="ml-2 truncate">{name}</span>
      </Button>
    </Tooltip>
  );
}
