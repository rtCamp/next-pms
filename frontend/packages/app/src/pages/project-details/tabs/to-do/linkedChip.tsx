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

const toLinkedRecordParams = (record: LinkedRecord): Record<string, string> =>
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

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto max-w-64 gap-1 px-1 py-0 text-sm text-ink-gray-6"
      iconLeft={LINKED_RECORD_ICON[record.type]}
      label={record.title}
      aria-label={`Open ${record.type.toLowerCase()} ${record.title}`}
      onClick={() => setSearchParams(toLinkedRecordParams(record))}
    />
  );
}
