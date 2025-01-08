/**
 * External dependencies.
 */
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { Spinner } from "@/app/components/spinner";
import { useToast } from "@/app/components/ui/use-toast";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { RootState } from "@/store";
import { PermissionProps, setResourcePermissions } from "@/store/resource_management/allocation";
import { resetResourcePermissions } from "@/store/resource_management/allocation";
import { resetState as resetProjectState, setMaxWeek as setProjectMaxWeek } from "@/store/resource_management/project";
import { resetState as resetTeamState, setMaxWeek as setTeamMaxWeek } from "@/store/resource_management/team";

import ResourceProjectView from "./project";
import ResourceTeamView from "./team";

/**
 * This is main component which is responsible for rendering the page of resource management.
 *
 * @returns React.FC
 */
const ResourcePage = ({ type }: { type: "team" | "project" }) => {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const resourceAllocationPermission: PermissionProps = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );

  const { data, isLoading, isValidating, error } = useFrappeGetCall(
    "next_pms.resource_management.api.permission.get_user_resources_permissions",
    {},
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: false,
    }
  );

  useEffect(() => {
    if (data) {
      dispatch(setResourcePermissions(data.message));
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

  useEffect(() => {
    if (type == "team") {
      dispatch(resetProjectState());
    } else {
      dispatch(resetTeamState());
    }
    return () => {
      dispatch(setProjectMaxWeek(5));
      dispatch(setTeamMaxWeek(5));
    };
  }, [dispatch, type]);

  return (
    <>
      {(isLoading || isValidating) && Object.keys(resourceAllocationPermission).length == 0 ? (
        <Spinner isFull />
      ) : type == "team" ? (
        Object.keys(resourceAllocationPermission).length != 0 && <ResourceTeamView />
      ) : (
        Object.keys(resourceAllocationPermission).length != 0 && <ResourceProjectView />
      )}
    </>
  );
};

export default ResourcePage;
