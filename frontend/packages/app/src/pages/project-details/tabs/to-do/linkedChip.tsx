/**
 * External dependencies.
 */
import { useSearchParams } from "react-router";
import { Button } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { TAB_PARAM } from "@/pages/project-details/constants";
import { LINKED_RECORD_ICON } from "./constants";
import type { LinkedRecord } from "./types";
import {
  SEARCH_PARAM,
  TABLE_TAB_PARAM,
  VIEW_PARAM,
} from "../calendar/constants";
import { GROWTH_DETAIL_PARAM } from "../growth/constants";

const toRecordParams = (record: LinkedRecord): Record<string, string> =>
  record.type === "Growth Initiative"
    ? { [TAB_PARAM]: "growth", [GROWTH_DETAIL_PARAM]: record.name }
    : {
        [TAB_PARAM]: "calendar",
        [VIEW_PARAM]: "list",
        [TABLE_TAB_PARAM]:
          record.type === "Milestone" ? "milestones" : "touchpoints",
        [SEARCH_PARAM]: record.title,
      };

export function LinkedChip({ record }: { record: LinkedRecord }) {
  const [, setSearchParams] = useSearchParams();
  const Icon = LINKED_RECORD_ICON[record.type];

  return (
    <Button
      variant="ghost"
      size="sm"
      className="min-w-0 max-w-64 text-sm text-ink-gray-5 hover:text-ink-gray-7"
      aria-label={`Open ${record.type.toLowerCase()} ${record.title}`}
      onClick={() => setSearchParams(toRecordParams(record))}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <Icon className="size-3.5 shrink-0" />
        <span className="min-w-0 truncate">{record.title}</span>
      </span>
    </Button>
  );
}
