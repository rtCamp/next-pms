/**
 * External dependencies.
 */
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spinner } from "@/app/components/spinner";

/**
 * Internal dependencies.
 */
import { useToast } from "@/app/components/ui/use-toast";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { RootState } from "@/store";
import { AllocationDataProps, PermissionProps } from "@/store/resource_management/allocation";
import { setData, setReFetchData, setStart } from "@/store/resource_management/team";

import { getIsBillableValue } from "../utils/helper";
import { getMergeData } from "../utils/value";
import AddResourceAllocations from "../components/AddAllocation";
import { FooterSection } from "../components/Footer";
import { useFrappeGetCallInfinite } from "../hooks/useFrappeGetCallInfinite";
import { ResourceTeamTable } from "./components/Table";

/**
 * This is main component which is responsible for rendering the team view of resource management.
 *
 * @returns React.FC
 */
const ResourceTeamView = () => {
  const { toast } = useToast();
  const resourceTeamState = useSelector((state: RootState) => state.resource_team);
  const resourceAllocationForm: AllocationDataProps = useSelector((state: RootState) => state.resource_allocation_form);
  const dispatch = useDispatch();
  const resourceAllocationPermission: PermissionProps = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );

  const getKey = (pageIndex: number, previousPageData: any) => {
    const indexTillNeedToFetchData = resourceTeamState.start / resourceTeamState.pageLength + 1;
    if (indexTillNeedToFetchData <= pageIndex) return null;
    if (previousPageData && !previousPageData.message.has_more) return null;
    return `next_pms.resource_management.api.team.get_resource_management_team_view_data/get_resource_management_team_view_data?page=${pageIndex}&limit=${resourceTeamState.pageLength}`;
  };

  const { data, isLoading, isValidating, error, size, setSize, mutate } = useFrappeGetCallInfinite(
    "next_pms.resource_management.api.team.get_resource_management_team_view_data",
    getKey,
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
        }
      : {
          date: resourceTeamState.weekDate,
          max_week: 3,
          page_length: resourceTeamState.pageLength,
          employee_name: resourceTeamState.employeeName,
        },
    { parallel: true }
  );

  const onFormSubmit = useCallback(() => {
    dispatch(setReFetchData(true));
  }, [dispatch]);

  useEffect(() => {
    if (resourceTeamState.isNeedToFetchDataAfterUpdate) {
      mutate();
      dispatch(setReFetchData(false));
    }
  }, [resourceTeamState.isNeedToFetchDataAfterUpdate]);

  useEffect(() => {
    if (data) {
      const mergeData = getMergeData(data);
      dispatch(setData(mergeData));
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
    setSize((resourceTeamState.start + resourceTeamState.pageLength) / resourceTeamState.pageLength + 1);
  };

  return (
    <>
      {(isLoading || isValidating) && resourceTeamState.data.data.length == 0 ? (
        <Spinner isFull />
      ) : (
        <ResourceTeamTable />
      )}

      {resourceAllocationForm.isShowDialog && <AddResourceAllocations onSubmit={onFormSubmit} />}

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
