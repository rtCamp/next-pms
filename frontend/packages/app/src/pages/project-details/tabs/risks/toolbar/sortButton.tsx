/**
 * External dependencies.
 */
import { useSearchParams } from "react-router-dom";
import { SortButton as SortButtonBase } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { RISK_VIEW_PARAM } from "../constants";
import { useRisks } from "../context";

const SORT_FIELDS = [
  { field: "modified", label: "Last updated on" },
  { field: "status", label: "Status" },
  { field: "risk_category", label: "Risk category" },
  { field: "risk_level", label: "Risk level" },
];

export function SortButton() {
  const [searchParams] = useSearchParams();
  const isKanban = searchParams.get(RISK_VIEW_PARAM) === "kanban";
  const sort = useRisks((c) => c.state.sort);
  const setSort = useRisks((c) => c.actions.setSort);

  const sortFields = isKanban
    ? SORT_FIELDS.filter((f) => f.field !== "status")
    : SORT_FIELDS;

  return (
    <SortButtonBase fields={sortFields} sort={sort} onSortChange={setSort} />
  );
}
