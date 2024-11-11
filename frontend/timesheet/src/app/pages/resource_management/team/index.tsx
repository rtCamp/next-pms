import { useFrappeGetCall } from "frappe-react-sdk";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setData, updateData } from "@/store/resource_management/team";
import { useToast } from "@/app/components/ui/use-toast";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useEffect } from "react";
import { Spinner } from "@/app/components/spinner";
import { ResourceTable } from "./components/Table";
import { HeaderSection } from "./components/Header";
import { FooterSection } from "./components/Footer";

const ResourceTeamView = () => {
  const { toast } = useToast();
  const resourceTeamState = useSelector((state: RootState) => state.resource_team);
  const dispatch = useDispatch();

  const { data, isLoading, isValidating, error } = useFrappeGetCall(
    "frappe_pms.resource_management.api.team.get_compact_view_data",
    {
      date: resourceTeamState.weekDate,
      max_week: 2,
      page_length: resourceTeamState.pageLength,
      employee_name: resourceTeamState.employeeName,
      business_unit: resourceTeamState.businessUnit,
      start: resourceTeamState.start,
    },
    undefined,
    {
      revalidateIfStale: false,
    }
  );

  useEffect(() => {

    if (data) {
      if (Object.keys(resourceTeamState.data.data).length > 0 && resourceTeamState.data.dates.length > 0) {
        dispatch(updateData(data.message));
      } else {
        dispatch(setData(data.message));
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
      <HeaderSection />
      {(isLoading || isValidating) && resourceTeamState.data.data.length == 0 ? <Spinner isFull /> : <ResourceTable />}
      <FooterSection isLoading={isLoading} isValidating={isValidating} />
    </>
  );
};

export default ResourceTeamView;
