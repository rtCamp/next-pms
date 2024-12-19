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

import { ResourceTeamHeaderSection } from "./team/components/Header";
import ResourceTeamView from "./team";
import { ResourceProjectHeaderSection } from "./project/components/Header";
import ResourceProjectView from "./project";

/**
 * This is main component which is responsible for rendering the page of resource management.
 *
 * @returns React.FC
 */
const ResourcePage = ({ type }: { type: "team" | "project" }) => {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const resourceAllocationPermission: PermissionProps | {} = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );

  const { data, isLoading, isValidating, error } = useFrappeGetCall(
    "next_pms.resource_management.api.permission.get_user_resources_rpermissions"
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

  if (type == "team") {
    return (
      <>
        <ResourceTeamHeaderSection />
        {isLoading || isValidating || Object.keys(resourceAllocationPermission).length == 0 ? (
          <Spinner isFull />
        ) : (
          <ResourceTeamView />
        )}
      </>
    );
  }

  return (
    <>
      <ResourceProjectHeaderSection />
      {isLoading || isValidating || Object.keys(resourceAllocationPermission).length == 0 ? (
        <Spinner isFull />
      ) : (
        <ResourceProjectView />
      )}
    </>
  );
};

export default ResourcePage;
