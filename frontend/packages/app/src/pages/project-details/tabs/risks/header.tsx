/**
 * External dependencies.
 */
import { Button } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { useRisks } from "./context";
import { RisksToolbar } from "./toolbar/toolbar";

export function RisksHeader() {
  const openCreateRisk = useRisks((c) => c.actions.openCreateRisk);

  return (
    <>
      <div className="flex items-center justify-between mb-3.5">
        <h1 className="text-xl font-semibold text-ink-gray-8">Risks</h1>
        <Button
          variant="solid"
          label="Create"
          iconLeft={() => <AddSm />}
          onClick={openCreateRisk}
        />
      </div>

      <RisksToolbar />
    </>
  );
}
