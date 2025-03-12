/**
 * External dependencies
 */
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Spinner, useToast } from "@next-pms/design-system/components";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies
 */
import { Main } from "@/app/layout/root";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { EmployeeDetailHeader } from "./header";
import ProjectTabs from "./tabs";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const { toast } = useToast();
  const { data, isLoading, error, mutate } = useFrappeGetCall(
    "next_pms.timesheet.api.project.get_project_details",
    {
      name: projectId,
    },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );
  useEffect(() => {
    if (data) {
      console.log(data.message);
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
  }, [data, isLoading, error, mutate]);
  return (
    <>
      <EmployeeDetailHeader />
      <Main className="w-full h-full overflow-y-auto">
        {isLoading ? <Spinner isFull /> : data?.message?.tabs && <ProjectTabs tabs={data?.message?.tabs} />}
      </Main>
    </>
  );
};

export default ProjectDetail;
