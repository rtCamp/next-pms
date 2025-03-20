/**
 * External dependencies
 */
import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Spinner, useToast } from "@next-pms/design-system/components";
import { useFrappeGetCall, useFrappeGetDoc } from "frappe-react-sdk";

/**
 * Internal dependencies
 */
import FormView from "@/app/components/form-view";
import { Main } from "@/app/layout/root";
import { getCurrencySymbol, parseFrappeErrorMsg } from "@/lib/utils";
import { EmployeeDetailHeader } from "./components/header";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const { data: projectData, error: projectError } = useFrappeGetDoc("Project", projectId);
  const formRef = useRef<{ submitForm: () => void }>(null);

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
    if (projectError) {
      const err = parseFrappeErrorMsg(projectError);
      toast({
        variant: "destructive",
        description: err,
      });
    }
  }, [projectError, toast]);

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
      <Main className="w-full h-full px-0">
        {isLoading ? (
          <Spinner isFull />
        ) : (
          <FormView
            tabs={data?.message?.tabs}
            currencySymbol={getCurrencySymbol(projectData?.custom_currency) || ""}
            tabHeaderClassName="w-full"
            tabBodyClassName="xl:w-4/5"
            onChange={(data) => console.log(data)}
            onSubmit={(data) => console.log(data)}
            formRef={formRef}
            readOnly={!data?.message?.permissions?.includes("write")}
          />
        )}
      </Main>
    </>
  );
};

export default ProjectDetail;
