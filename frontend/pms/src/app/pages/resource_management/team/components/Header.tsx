import { Button } from "@/app/components/ui/button";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { ComboxBox } from "@/app/components/comboBox";
import { Badge } from "@/app/components/ui/badge";
import { Header } from "@/app/layout/root";
import {
  setWeekDate,
  setEmployeeName,
  setBusinessUnit,
  setFilters,
  resetState,
  setCombineWeekHours,
  setView,
} from "@/store/resource_management/team";
import { getFormatedDate, cn } from "@/lib/utils";
import { useCallback, useEffect } from "react";
import { addDays } from "date-fns";
import { DeBounceInput } from "@/app/components/deBounceInput";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { useQueryParamsState } from "@/lib/queryParam";
import { Checkbox } from "@/app/components/ui/checkbox";
import { useFrappeGetCall } from "frappe-react-sdk";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

const HeaderSection = () => {
  const [businessUnitParam, setBusinessUnitParam] = useQueryParamsState<string[]>("business_unit", []);
  const [employeeNameParam, setEmployeeNameParam] = useQueryParamsState<string>("employee-name", "");

  useEffect(() => {
    const payload = {
      businessUnit: businessUnitParam,
      employeeName: employeeNameParam,
    };
    dispatch(setFilters(payload));
    return () => {
      dispatch(resetState());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resourceTeamState = useSelector((state: RootState) => state.resource_team);
  const dispatch = useDispatch();

  const { data: businessUnit } = useFrappeGetCall(
    "frappe.client.get_list",
    {
      doctype: "Business Unit",
      fields: ["name"],
      limit_page_length: 0,
    },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  const handleprevWeek = useCallback(() => {
    const date = getFormatedDate(addDays(resourceTeamState.data.dates[0].start_date, -3));
    dispatch(setWeekDate(date));
  }, [dispatch, resourceTeamState.data.dates]);

  const handlenextWeek = useCallback(() => {
    const date = getFormatedDate(addDays(resourceTeamState.data.dates[0].end_date,+1));
    dispatch(setWeekDate(date));
  }, [dispatch, resourceTeamState.data.dates]);

  const handleBusinessUnitChange = useCallback(
    (value: string | string[]) => {
      dispatch(setBusinessUnit(value as string[]));
      setBusinessUnitParam(value as string[]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch]
  );

  const handleEmployeeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setEmployeeName(e.target.value));
      setEmployeeNameParam(e.target.value);
    },
    [dispatch, setEmployeeNameParam]
  );

  return (
    <Header className="flex items-center max-md:flex-col">
      <div id="filters" className="flex gap-x-3 max-md:gap-x-5  overflow-y-hidden max-md:w-full items-center">
        <DeBounceInput
          placeholder="Employee name"
          value={employeeNameParam}
          deBounceValue={400}
          className="max-w-40 min-w-40"
          callback={handleEmployeeChange}
        />
        <ComboxBox
          value={businessUnitParam}
          label="Business Unit"
          isMulti
          shouldFilter
          showSelected={false}
          onSelect={handleBusinessUnitChange}
          rightIcon={[].length > 0 && <Badge className="px-1.5">{0}</Badge>}
          leftIcon={<Filter className={cn("h-4 w-4", [].length != 0 && "fill-primary")} />}
          // Need to fetch this
          data={
            businessUnit?.message?.map((d: { name: string }) => ({
              label: d.name,
              value: d.name,
            })) ?? []
          }
          className="text-primary border-dashed gap-x-2 font-normal w-fit"
        />
        <ViewControl />
      </div>

      <div id="date-filter" className="flex gap-x-2 max-md:p-1 max-md:w-full max-md:justify-between max-md:m-2 t">
        <Button title="prev" className="p-1 h-fit" variant="outline" onClick={handleprevWeek}>
          <ChevronLeft className="w-4 max-md:w-3 h-4 max-md:h-3" />
        </Button>
        <Button title="next" className="p-1 h-fit" variant="outline" onClick={handlenextWeek}>
          <ChevronRight className="w-4 max-md:w-3 h-4 max-md:h-3" />
        </Button>
      </div>
    </Header>
  );
};

const ViewControl = () => {
  const [viewParam, setViewParam] = useQueryParamsState<string>("view_type", "planned-vs-capacity");
  const [combineWeekHoursParam, setCombineWeekHoursParam] = useQueryParamsState<boolean>("combine-week-hours", true);

  useEffect(() => {
    dispatch(setView(viewParam));
    dispatch(setCombineWeekHours(combineWeekHoursParam));
    return () => {
      dispatch(resetState());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resourceTeamStateTableView = useSelector((state: RootState) => state.resource_team.tableView);
  const dispatch = useDispatch();

  return (
    <div className="flex items-center gap-x-2">
      <Select
        defaultValue={resourceTeamStateTableView.view}
        onValueChange={(value) => {
          setViewParam(value);
          dispatch(setView(value));
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select a view type" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Views</SelectLabel>
            <SelectItem value="planned-vs-capacity">Planned vs Capacity</SelectItem>
            <SelectItem value="actual-vs-planned">Actual vs Planned</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-x-2">
        <Checkbox
          id="combineWeekHours"
          checked={resourceTeamStateTableView.combineWeekHours}
          onClick={() => {
            setCombineWeekHoursParam(!resourceTeamStateTableView.combineWeekHours);
            dispatch(setCombineWeekHours(!resourceTeamStateTableView.combineWeekHours));
          }}
        />
        <label
          htmlFor="terms"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Combine Week Hours
        </label>
      </div>
    </div>
  );
};

export { HeaderSection };
