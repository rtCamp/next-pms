/**
 * Internal dependencies.
 */
import { ErrorFallback } from "@next-pms/design-system/components";
import { AllocationsProjectTable } from "./allocationsProjectTable";

function AllocationsProject() {
  return (
    <ErrorFallback>
      <AllocationsProjectTable />
    </ErrorFallback>
  );
}

export default AllocationsProject;
