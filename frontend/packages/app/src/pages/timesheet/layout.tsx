/**
 * External dependencies.
 */
import { Outlet } from "react-router-dom";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { TimesheetBreadcrumbs } from "@/pages/timesheet/components/timesheet-breadcrumbs";

function TimesheetLayout() {
  return (
    <>
      <Header>
        <TimesheetBreadcrumbs />
      </Header>

      <Outlet />
    </>
  );
}

export default TimesheetLayout;
