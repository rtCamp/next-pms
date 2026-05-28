/**
 * External dependencies.
 */
import { Button } from "@rtcamp/frappe-ui-react";
import { Plus } from "lucide-react";

/**
 * Internal dependencies.
 */
import { useRisks } from "./context";

export function RisksHeader() {
  const openCreateRisk = useRisks((c) => c.actions.openCreateRisk);

  return (
    <div className="flex items-center justify-between mb-3.5">
      <h1 className="text-xl font-semibold text-ink-gray-8">Risks</h1>
      <Button
        variant="solid"
        label="Create"
        iconLeft={() => <Plus />}
        onClick={openCreateRisk}
      />
    </div>
  );
}
