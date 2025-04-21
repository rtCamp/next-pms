/**
 * External dependencies
 */
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Spinner, useToast } from "@next-pms/design-system/components";
import { useFrappeGetCall, useFrappeGetDoc, useFrappeUpdateDoc } from "frappe-react-sdk";

/**
 * Internal dependencies
 */
import FormView from "@/app/components/form-view";
import { FieldConfigType } from "@/app/components/form-view/types";
import { Main } from "@/app/layout/root";
import { getCurrencySymbol, parseFrappeErrorMsg } from "@/lib/utils";
import { ProjectDetailHeader } from "./components/header";

const ProjectDetail = () => {
  const { projectId } = useParams();
  const { data: projectData, error: projectError } = useFrappeGetDoc("Project", projectId);
  const formRef = useRef<{ submitForm: () => void }>(null);
  const [hideSaveChanges, setHideSaveChanges] = useState<boolean>(true);
  const [formData, setFormData] = useState<Record<string, string | number | null>>({});
  const [projectName, setProjectName] = useState<string>("");

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

  const { updateDoc, loading, error: updateError, isCompleted } = useFrappeUpdateDoc();

  useEffect(() => {
    if (isCompleted) {
      setHideSaveChanges(true);
      setProjectName(formData?.project_name as string);
      toast({
        variant: "success",
        description: "Project updated",
      });
      mutate();
    }
    if (updateError) {
      const err = parseFrappeErrorMsg(updateError);
      toast({
        variant: "destructive",
        description: err,
      });
    }
  }, [loading, updateError, toast, isCompleted, mutate]);

  return (
    <>
      <ProjectDetailHeader
        projectId={projectId!}
        disabled={loading || hideSaveChanges}
        hideSaveChanges={false}
        projectName={projectName}
        formRef={formRef}
      />
      <Main className="w-full h-full px-0">
        {isLoading ? (
          <Spinner isFull />
        ) : (
          <FormView
            docname={projectId as string}
            doctype={"Project"}
            tabs={data?.message?.tabs}
            currencySymbol={getCurrencySymbol(projectData?.custom_currency) || ""}
            tabHeaderClassName="w-full"
            tabBodyClassName="xl:w-4/5"
            onChange={(form_data) => {
              if ((window?.frappe?.boot?.user?.can_write?.includes("Project") ?? true) && form_data) {
                setHideSaveChanges(false);
                setFormData(form_data);
              } else {
                setHideSaveChanges(true);
              }
            }}
            onSubmit={async (data) => {
              const sanitizedFormData = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== ""));
              await updateDoc("Project", projectId as string, sanitizedFormData);
            }}
            formRef={formRef}
            readOnly={!(window?.frappe?.boot?.user?.can_write?.includes("Project") ?? true)}
            fieldConfig={
              {
                naming_series: { hidden: true },
                department: { hidden: true },
                custom_project_documents_url: { hidden: true },
                custom_3rd_parties: { hidden: true },
                custom_project_manager_name: { hidden: true },
                custom_engineering_manager_name: { hidden: true },
                is_active: { hidden: true },
                sales_order: { hidden: true },
                custom_project_size: { readOnly: true },
                notes: { hidden: true },
                customer: { readOnly: true },
                custom_currency: { readOnly: true },
                custom_sources: { readOnly: true },
                custom_deal_type: { readOnly: true },
                project_type: { readOnly: true },
                custom_restricted_under_nda: { readOnly: true },
                custom_billing_type: { readOnly: true },
              } as FieldConfigType
            }
            mutateData={mutate}
          />
        )}
      </Main>
    </>
  );
};

export default ProjectDetail;
