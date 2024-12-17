import { useFrappeGetCall } from "frappe-react-sdk";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setData, setStart, updateData, setReFetchData } from "@/store/resource_management/project";
import { useToast } from "@/app/components/ui/use-toast";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useCallback, useEffect } from "react";
import { Spinner } from "@/app/components/spinner";
import { ResourceProjectTable } from "./components/Table";
import { ResourceProjectHeaderSection } from "./components/Header";
import { FooterSection } from "../components/Footer";
import { AllocationDataProps, PermissionProps, setResourcePermissions } from "@/store/resource_management/allocation";
import AddResourceAllocations from "../components/AddAllocation";
import { getIsBillableValue } from "../utils/helper";

const ResourceTeamView = () => {
  const { toast } = useToast();
  const resourceProjectState = useSelector((state: RootState) => state.resource_project);
  const ResourceAllocationForm: AllocationDataProps = useSelector((state: RootState) => state.resource_allocation_form);
  const resourceAllocationPermission: PermissionProps = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );
  const dispatch = useDispatch();

  const { data, isLoading, isValidating, error, mutate } = useFrappeGetCall(
    "next_pms.resource_management.api.project.get_resource_management_project_view_data",
    resourceAllocationPermission.write
      ? {
          date: resourceProjectState.weekDate,
          max_week: 3,
          page_length: resourceProjectState.pageLength,
          project_name: resourceProjectState.projectName,
          customer: resourceProjectState.customer,
          start: resourceProjectState.start,
          is_billable: getIsBillableValue(resourceProjectState.allocationType as string[]),
        }
      : {
          date: resourceProjectState.weekDate,
          max_week: 3,
          page_length: resourceProjectState.pageLength,
          project_name: resourceProjectState.projectName,
          start: resourceProjectState.start,
        },
    undefined,
    {
      revalidateIfStale: false,
      revalidateOnMount: true,
    }
  );

  const onFormSubmit = useCallback(() => {
    dispatch(setReFetchData(true));
  }, [dispatch]);

  const refetchData = useCallback(() => {
    if (resourceProjectState.isNeedToFetchDataAfterUpdate) {
      mutate().then((r) => {
        if (r.message) {
          dispatch(setData(r.message));
        }
      });
      dispatch(setReFetchData(false));
    }
  }, [dispatch, mutate, resourceProjectState.isNeedToFetchDataAfterUpdate]);

  useEffect(() => {
    refetchData();
  }, [refetchData, resourceProjectState.isNeedToFetchDataAfterUpdate]);

  useEffect(() => {
    if (data) {
      if (Object.keys(resourceProjectState.data.data).length > 0 && resourceProjectState.data.dates.length > 0) {
        if (data.message.data.length > 0) {
          if (data.message.data[0].name == resourceProjectState.data.data[0].name) {
            return;
          }
        }
        dispatch(updateData(data.message));
      } else {
        dispatch(setData(data.message));
      }
      dispatch(setResourcePermissions(data.message.permissions));
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

  const handleLoadMore = () => {
    if (!resourceProjectState.hasMore) return;
    dispatch(setStart(resourceProjectState.start + resourceProjectState.pageLength));
  };

  return (
    <>
      <ResourceProjectHeaderSection />

      {(isLoading || isValidating) && resourceProjectState.data.data.length == 0 ? (
        <Spinner isFull />
      ) : (
        <ResourceProjectTable />
      )}

      {ResourceAllocationForm.isShowDialog && <AddResourceAllocations onSubmit={onFormSubmit} />}

      <FooterSection
        disabled={
          !resourceProjectState.hasMore ||
          ((isLoading || isValidating) && Object.keys(resourceProjectState.data.data).length != 0)
        }
        handleLoadMore={handleLoadMore}
        length={Object.keys(resourceProjectState.data.data).length | 0}
        total_count={resourceProjectState.data.total_count | 0}
      />
    </>
  );
};

export default ResourceTeamView;
