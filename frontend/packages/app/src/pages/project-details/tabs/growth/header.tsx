/**
 * External dependencies.
 */
import { Button } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { canCreate } from "@/lib/utils";
import { GROWTH_DOCTYPE } from "./constants";
import { useGrowth } from "./context";
import { GrowthToolbar } from "./toolbar/toolbar";

export function GrowthHeader() {
  const openCreate = useGrowth((c) => c.actions.openCreate);

  return (
    <>
      <div className="flex items-center justify-between mb-3.5">
        <h1 className="text-xl font-semibold text-ink-gray-8">Growth</h1>
        {canCreate(GROWTH_DOCTYPE) && (
          <Button
            variant="solid"
            label="Create"
            iconLeft={AddSm}
            onClick={openCreate}
          />
        )}
      </div>
      <GrowthToolbar />
    </>
  );
}
