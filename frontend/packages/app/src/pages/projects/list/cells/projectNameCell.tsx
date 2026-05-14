/**
 * External dependencies.
 */
import { Link } from "react-router-dom";
import { mergeClassNames } from "@next-pms/design-system";
import { Tooltip } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { pickAllowed } from "@/lib/utils";
import { Dot } from "./dot";
import { RAG_STATUS } from "../../constants";
import { RagStatus } from "../../types";

export function ProjectNameCell({
  id,
  name,
  riskLevel,
}: {
  id: string;
  name: string;
  riskLevel?: string;
}) {
  const risk = pickAllowed<RagStatus>(riskLevel, RAG_STATUS);

  return (
    <Tooltip text={name}>
      <Link
        to={`${ROUTES.project}/${id}`}
        className={mergeClassNames(
          "inline-flex items-center justify-start w-full h-7 px-0 rounded text-base font-medium ",
          "text-ink-gray-8 bg-transparent hover:bg-surface-gray-3 active:bg-surface-gray-4 ",
          "focus:outline-none focus-visible:ring focus-visible:ring-outline-gray-3 transition-colors",
        )}
      >
        {risk && <Dot risk={risk} />}
        <span className="ml-2 truncate">{name}</span>
      </Link>
    </Tooltip>
  );
}
