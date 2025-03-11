/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { Main } from "@/app/layout/root";
import { EmployeeDetailHeader } from "./header";

const ProjectDetail = () => {
  return (
    <>
      <EmployeeDetailHeader />
      <Main className="w-full h-full overflow-y-auto">Project detail Page</Main>
    </>
  );
};

export default ProjectDetail;
