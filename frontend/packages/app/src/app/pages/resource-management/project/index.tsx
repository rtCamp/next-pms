/**
 * External dependencies.
 */
import { useCallback, useEffect } from "react";
import { getNextDate } from "@next-pms/design-system";
import { Spinner, useToast } from "@next-pms/design-system/components";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import AddResourceAllocations from "../components/addAllocation";
import { ResourceProjectHeaderSection } from "./components/header";
import { getIsBillableValue } from "../utils/helper";
import { ResourceProjectTable } from "./components/table";
import { ProjectContext, ProjectContextProvider } from "../store/projectContext";
import { ResourceContextProvider, ResourceFormContext } from "../store/resourceFormContext";
import type { AllocationDataProps, ProjectDataProps } from "../store/types";

const ResourceTeamViewWrapper = () => {
  return (
    <ResourceContextProvider>
      <ProjectContextProvider>
        <ResourceTeamView />
      </ProjectContextProvider>
    </ResourceContextProvider>
  );
};

/**
 * This is main component which is responsible for rendering the project view of resource management.
 *
 * @returns React.FC
 */
const ResourceTeamView = () => {
  const { toast } = useToast();
  const { permission: resourceAllocationPermission, dialogState: resourceAllocationDialogState } = useContextSelector(
    ResourceFormContext,
    (value) => value
  );
  const { projectData, filters, apiController, updateProjectData, setReFetchData } = useContextSelector(
    ProjectContext,
    (value) => value
  );

  const { call: fetchSingleRecord } = useFrappePostCall(
    "next_pms.resource_management.api.project.get_resource_management_project_view_data"
  );

  const { data, isLoading, isValidating, error, mutate } = useFrappeGetCall(
    "next_pms.resource_management.api.project.get_resource_management_project_view_data",
    resourceAllocationPermission.write
      ? {
          date: filters.weekDate,
          max_week: filters.maxWeek,
          page_length: filters.pageLength,
          project_name: filters.projectName,
          customer: filters.customer,
          billing_type: filters.billingType,
          is_billable: getIsBillableValue(filters.allocationType as string[]),
          start: filters.start,
        }
      : {
          date: filters.weekDate,
          max_week: filters.maxWeek,
          page_length: filters.pageLength,
          project_name: filters.projectName,
          start: filters.start,
        },
    "next_pms.resource_management.api.project.get_resource_management_project_view_data_resource_project_page",
    { revalidateOnFocus: false, revalidateOnReconnect: false, revalidateIfStale: false, revalidateOnMount: false }
  );

  const onFormSubmit = useCallback(
    (oldData: AllocationDataProps, newData: AllocationDataProps) => {
      fetchSingleRecord({
        date: filters.weekDate,
        max_week: filters.maxWeek,
        project_id: JSON.stringify([oldData.project, newData.project]),
        is_billable: getIsBillableValue(filters.allocationType as string[]),
      }).then((res) => {
        const newProject = res.message?.data;
        if (newProject && newProject.length > 0) {
          const updatedData = projectData.data.map((item) => {
            const index = newProject.findIndex((project: ProjectDataProps) => project.name == item.name);
            if (index != -1) {
              return newProject[index];
            }
            return item;
          });
          updateProjectData({ ...projectData, data: updatedData });
        }
      });
    },
    [fetchSingleRecord, filters.weekDate, filters.maxWeek, filters.allocationType, projectData, updateProjectData]
  );

  useEffect(() => {
    if (apiController.isNeedToFetchDataAfterUpdate) {
      mutate();
      setReFetchData(false);
    }
  }, [data, mutate, apiController.isNeedToFetchDataAfterUpdate, setReFetchData]);

  useEffect(() => {
    if (data) {
      if (apiController.action == "SET") {
        updateProjectData(data.message);
      } else {
        updateProjectData(data.message, "UPDATE");
      }
    }

    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, error]);

  return (
    <>
      <ResourceProjectHeaderSection />

      {(isLoading || isValidating) && projectData.data.length == 0 ? (
        <Spinner isFull />
      ) : (
        <ResourceProjectTable
          dateToAddHeaderRef={getNextDate(filters.weekDate, filters.maxWeek - 1)}
          onSubmit={onFormSubmit}
        />
      )}

      {resourceAllocationDialogState.isShowDialog && <AddResourceAllocations onSubmit={onFormSubmit} />}
    </>
  );
};

export default ResourceTeamViewWrapper;
