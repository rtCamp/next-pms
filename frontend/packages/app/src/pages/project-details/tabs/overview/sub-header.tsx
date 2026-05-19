/**
 * External dependencies.
 */
import { Button } from "@rtcamp/frappe-ui-react";
import { Pencil } from "lucide-react";

export function OverviewSubHeader() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-lg font-semibold text-ink-gray-8">Overview</h1>
      <Button
        variant="solid"
        iconLeft={() => <Pencil size={16} />}
        onClick={() => {
          console.log("TODO(#1263): wire up Overview Edit action");
        }}
      >
        Edit
      </Button>
    </div>
  );
}
