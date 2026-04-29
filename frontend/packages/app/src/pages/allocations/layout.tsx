/**
 * External dependencies.
 */
import { Outlet } from "react-router-dom";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { AllocationsBreadcrumbs } from "@/pages/allocations/components/allocationsBreadcrumbs";

function AllocationLayout() {
  return (
    <>
      <Header className="justify-between px-5">
        <AllocationsBreadcrumbs />
      </Header>

      <Outlet />
    </>
  );
}

export default AllocationLayout;
