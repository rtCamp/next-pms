/**
 * External dependencies
 */
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Spinner, useToast } from "@next-pms/design-system/components";
import { useFrappeGetCall } from "frappe-react-sdk";
import FormView from "@/app/components/form-view";

/**
 * Internal dependencies
 */
import { Main } from "@/app/layout/root";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { EmployeeDetailHeader } from "./header";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const { data, isLoading, error, mutate } = useFrappeGetCall(
    "next_pms.api.get_doc_with_meta",
    {
      docname: projectId,
      doctype: "Project",
    },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );

  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
  }, [error, mutate, toast]);

  return (
    <>
      <EmployeeDetailHeader projectId={projectId!} />
      <Main className="w-full h-full overflow-y-auto px-0">
        {isLoading ? <Spinner isFull /> : <FormView tabs={data?.message?.tabs} readOnly={true} />}
      </Main>
    </>
  );
};

export default ProjectDetail;
