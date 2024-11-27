import {
  setWeekDate,
  setProjectName,
  setFilters,
  resetState,
  setCombineWeekHours,
  setView,
} from "@/store/resource_management/project";
import { getFormatedDate } from "@/lib/utils";
import { useCallback, useEffect } from "react";
import { addDays } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { useQueryParamsState } from "@/lib/queryParam";
import { ResourceHeaderSection } from "../../components/Header";
import { ChevronLeftIcon, ChevronRight, Plus } from "lucide-react";
import { setDialog } from "@/store/resource_management/allocation";

const ResourceProjectHeaderSection = () => {
  const [projectNameParam, setProjectNameParam] = useQueryParamsState<string>("prject-name", "");
  const [combineWeekHoursParam, setCombineWeekHoursParam] = useQueryParamsState<boolean>("combine-week-hours", true);
  const [viewParam, setViewParam] = useQueryParamsState<string>("view-type", "planned");

  const resourceTeamState = useSelector((state: RootState) => state.resource_project);
  const resourceTeamStateTableView = resourceTeamState.tableView;
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setView(viewParam));
    dispatch(setCombineWeekHours(combineWeekHoursParam));
    const payload = {
      projectName: projectNameParam,
    };
    dispatch(setFilters(payload));
    return () => {
      dispatch(resetState());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePrevWeek = useCallback(() => {
    const date = getFormatedDate(addDays(resourceTeamState.data.dates[0].start_date, -3));
    dispatch(setWeekDate(date));
  }, [dispatch, resourceTeamState.data.dates]);

  const handleNextWeek = useCallback(() => {
    const date = getFormatedDate(addDays(resourceTeamState.data.dates[0].end_date, +1));
    dispatch(setWeekDate(date));
  }, [dispatch, resourceTeamState.data.dates]);

  const handleProjectChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setProjectName(e.target.value));
      setProjectNameParam(e.target.value);
    },
    [dispatch, setProjectNameParam]
  );

  const handleViewChange = useCallback(
    (value: string) => {
      setViewParam(value);
      dispatch(setView(value));
    },
    [dispatch, setViewParam]
  );

  const handleWeekViewChange = useCallback(() => {
    setCombineWeekHoursParam(!resourceTeamStateTableView.combineWeekHours);
    dispatch(setCombineWeekHours(!resourceTeamStateTableView.combineWeekHours));
  }, [dispatch, resourceTeamStateTableView.combineWeekHours, setCombineWeekHoursParam]);

  return (
    <ResourceHeaderSection
      filters={[
        {
          queryParameterName: "project-name",
          handleChange: handleProjectChange,
          type: "search",
          value: projectNameParam,
          defaultValue: "",
          label: "Project Name",
        },
        {
          queryParameterName: "view-type",
          handleChange: handleViewChange,
          type: "select",
          value: resourceTeamStateTableView.view,
          defaultValue: "planned",
          label: "Views",
          data: [
            {
              label: "Planned",
              value: "planned",
            },
            {
              label: "Actual vs Planned",
              value: "actual-vs-planned",
            },
          ],
        },
        {
          queryParameterName: "combine-week-hours",
          handleChange: handleWeekViewChange,
          type: "checkbox",
          value: resourceTeamStateTableView.combineWeekHours,
          defaultValue: false,
          label: "Combine Week Hours",
        },
      ]}
      buttons={[
        // {
        //   title: "add-allocation",
        //   handleClick: () => {
        //     dispatch(setDialog(true));
        //   },
        //   icon: () => <Plus className="w-4 max-md:w-3 h-4 max-md:h-3" />,
        //   variant: "default",
        // },
        {
          title: "previous-week",
          handleClick: handlePrevWeek,
          icon: () => <ChevronLeftIcon className="w-4 max-md:w-3 h-4 max-md:h-3" />,
        },
        {
          title: "next-week",
          handleClick: handleNextWeek,
          icon: () => <ChevronRight className="w-4 max-md:w-3 h-4 max-md:h-3" />,
        },
      ]}
    />
  );
};

export { ResourceProjectHeaderSection };
