import { useFrappeGetCall } from "frappe-react-sdk";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setData, setReFetchData, setStart, updateData } from "@/store/resource_management/team";
import { useToast } from "@/app/components/ui/use-toast";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useCallback, useEffect } from "react";
import { Spinner } from "@/app/components/spinner";
import { ResourceTeamTable } from "./components/Table";
import { ResourceTeamHeaderSection } from "./components/Header";
import { FooterSection } from "../components/Footer";
import AddResourceAllocations from "../components/AddAllocation";
import { AllocationDataProps, PermissionProps, setResourcePermissions } from "@/store/resource_management/allocation";
import { getIsBillableValue } from "../utils/helper";

const ResourceTeamView = () => {
  const { toast } = useToast();
  const resourceTeamState = useSelector((state: RootState) => state.resource_team);
  const ResourceAllocationForm: AllocationDataProps = useSelector((state: RootState) => state.resource_allocation_form);
  const dispatch = useDispatch();
  const resourceAllocationPermission: PermissionProps = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );

  const { data, isLoading, isValidating, error, mutate } = useFrappeGetCall(
    "next_pms.resource_management.api.team.get_resource_management_team_view_data",
    resourceAllocationPermission.write
      ? {
          date: resourceTeamState.weekDate,
          max_week: 3,
          page_length: resourceTeamState.pageLength,
          employee_name: resourceTeamState.employeeName,
          business_unit: resourceTeamState.businessUnit,
          reports_to: resourceTeamState.reportingManager,
          designation: resourceTeamState.designation,
          is_billable: getIsBillableValue(resourceTeamState.allocationType as string[]),
          start: resourceTeamState.start,
        }
      : {
          date: resourceTeamState.weekDate,
          max_week: 3,
          page_length: resourceTeamState.pageLength,
          employee_name: resourceTeamState.employeeName,
          start: resourceTeamState.start,
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
    if (resourceTeamState.isNeedToFetchDataAfterUpdate) {
      mutate().then((r) => {
        if (r.message) {
          dispatch(setData(r.message));
        }
      });
      dispatch(setReFetchData(false));
    }
  }, [dispatch, mutate, resourceTeamState.isNeedToFetchDataAfterUpdate]);

  useEffect(() => {
    refetchData();
  }, [refetchData, resourceTeamState.isNeedToFetchDataAfterUpdate]);

  useEffect(() => {
    if (data) {
      if (Object.keys(resourceTeamState.data.data).length > 0 && resourceTeamState.data.dates.length > 0) {
        if (data.message.data.length > 0) {
          if (data.message.data[0].name == resourceTeamState.data.data[0].name) {
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
    if (!resourceTeamState.hasMore) return;
    dispatch(setStart(resourceTeamState.start + resourceTeamState.pageLength));
  };

  return (
    <>
      <ResourceTeamHeaderSection />

      {(isLoading || isValidating) && resourceTeamState.data.data.length == 0 ? (
        <Spinner isFull />
      ) : (
        <ResourceTeamTable />
      )}

      {ResourceAllocationForm.isShowDialog && <AddResourceAllocations onSubmit={onFormSubmit} />}

      <FooterSection
        disabled={
          !resourceTeamState.hasMore ||
          ((isLoading || isValidating) && Object.keys(resourceTeamState.data.data).length != 0)
        }
        handleLoadMore={handleLoadMore}
        length={Object.keys(resourceTeamState.data.data).length | 0}
        total_count={resourceTeamState.data.total_count | 0}
      />
    </>
  );
};

export default ResourceTeamView;
