import { Button } from "@/app/components/ui/button";
import { Filter, X } from "lucide-react";
import { ComboxBox } from "@/app/components/comboBox";
import { Badge } from "@/app/components/ui/badge";
import { Header } from "@/app/layout/root";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import { DeBounceInput } from "@/app/components/deBounceInput";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { CheckedState } from "@radix-ui/react-checkbox";
import { useFrappeGetCall } from "frappe-react-sdk";
import { useQueryParamsState } from "@/lib/queryParam";
import EmployeeCombo from "@/app/components/employeeComboBox";
import { removeValueFromArray } from "../utils/helper";

interface FilterPops {
  queryParameterName: string;
  queryParameterDefault: string | string[] | boolean | undefined;
  hide?: boolean;
  handleChange: any;
  handleDelete?: any;
  data?: { value: string; label: string }[];
  type: "search" | "select-search" | "select" | "checkbox" | "search-employee" | "select-list";
  value: string | number | boolean | string[] | undefined;
  defaultValue?: string | boolean | number;
  label?: string;
  className?: string;
  apiCall?: ApiCallProps;
}

interface ApiCallProps {
  url: string;
  filters: object;
  options?: object;
}

interface ButtonProps {
  title: string;
  handleClick: any;
  label?: string;
  icon?: React.FC;
  className?: string;
  variant?:
    | "link"
    | "default"
    | "destructive"
    | "success"
    | "warning"
    | "outline"
    | "secondary"
    | "ghost"
    | null
    | undefined;
  hide?: boolean;
}

interface HeaderSectionProps {
  filters: FilterPops[];
  buttons: ButtonProps[];
}

const ResourceHeaderSection = ({ filters, buttons }: HeaderSectionProps) => {
  return (
    <div className="border-b">
      <Header className="flex items-center max-md:flex-col" parentClassName="border-0">
        <div
          id="filters"
          className="flex gap-x-3 max-md:gap-x-5 overflow-y-hidden max-md:w-full items-center no-scrollbar"
        >
          {filters &&
            filters.map((filter: FilterPops) => {
              if (filter.hide) {
                return <></>;
              }
              return <RenderFilter filter={filter} key={filter.queryParameterName} />;
            })}
        </div>

        <div id="date-filter" className="flex gap-x-2 max-md:p-1 max-md:w-full max-md:justify-between max-md:m-2">
          {buttons &&
            buttons.map((button: ButtonProps) => {
              if (button.hide) {
                return <></>;
              }
              return (
                <Button
                  title={button.title}
                  className={cn("p-1 h-fit", button.className)}
                  variant={button.variant || "outline"}
                  onClick={button.handleClick}
                >
                  {button.icon && <button.icon />}
                  {button.label}
                </Button>
              );
            })}
        </div>
      </Header>
      <RenderFiltersValues filters={filters} />
    </div>
  );
};

const RenderFilter = ({ filter }: { filter: FilterPops }) => {
  const [queryParam, setQueryParam] = useQueryParamsState(filter.queryParameterName, filter.queryParameterDefault);

  const handleChangeWrapper = (value: string | CheckedState | string[]) => {
    setQueryParam(value);
    filter.handleChange && filter.handleChange(value);
  };

  useEffect(() => {
    setQueryParam(filter.value as string | CheckedState | string[]);
  }, [filter.value, setQueryParam]);

  if (filter.type == "search") {
    return (
      <DeBounceInput
        placeholder={filter.label}
        value={filter.value as string}
        deBounceValue={400}
        className="max-w-60 min-w-60"
        callback={(e) => handleChangeWrapper(e.target.value)}
      />
    );
  }

  if (filter.type === "search-employee") {
    return (
      <EmployeeCombo
        value={filter.value as string}
        label="Reporting Manager"
        status={["Active"]}
        onSelect={handleChangeWrapper}
        className="border-dashed min-w-48 w-full max-w-48"
      />
    );
  }

  if (filter.type == "select-search") {
    if (!filter.apiCall) {
      return <></>;
    }
    return <ComboxBoxWrapper filter={filter} handleChangeWrapper={handleChangeWrapper} />;
  }

  if (filter.type == "select-list") {
    return (
      <ComboxBox
        value={filter.value as string[]}
        label={filter.label as string}
        isMulti
        shouldFilter
        showSelected={false}
        onSelect={handleChangeWrapper}
        rightIcon={
          ((filter.value as string[])?.length ?? 0) > 0 && (
            <Badge className="px-1.5">{(filter.value as string[]).length}</Badge>
          )
        }
        leftIcon={<Filter className={cn("h-4 w-4", [].length != 0 && "fill-primary")} />}
        data={
          filter.data?.map((d: { value: string; label?: string }) => ({
            label: d.label,
            value: d.value,
          })) ?? []
        }
        className="text-primary border-dashed gap-x-2 font-normal w-fit"
      />
    );
  }

  if (filter.type == "select") {
    return (
      <Select value={filter.value as string} onValueChange={handleChangeWrapper}>
        <SelectTrigger className="max-w-44 min-w-44">
          <SelectValue placeholder="Select a view type" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{filter.label}</SelectLabel>
            {filter.data &&
              filter.data.map((item) => {
                return <SelectItem value={item.value}>{item.label}</SelectItem>;
              })}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  }

  if (filter.type == "checkbox") {
    return (
      <div className="flex items-center gap-x-2">
        <Checkbox
          id="combineWeekHours"
          checked={filter.value as CheckedState}
          onClick={(e) => handleChangeWrapper(e.target.value)}
        />
        <label
          htmlFor="terms"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 max-w-44 min-w-44"
        >
          {filter.label}
        </label>
      </div>
    );
  }
};

const RenderFiltersValues = ({ filters }: { filters: FilterPops[] }) => {
  const [updateFilters, setUpdateFilters] = useState<FilterPops[]>([]);

  useEffect(() => {
    const needToShowValues = filters.filter((filter) => {
      return (
        !filter.hide &&
        filter.value &&
        (filter.value as []).length != 0 &&
        filter.type != "checkbox" &&
        filter.type != "select"
      );
    });

    setUpdateFilters(needToShowValues);
  }, [filters]);

  if (updateFilters.length == 0) {
    return <></>;
  }

  return (
    <div id="filters" className="flex gap-x-2 max-md:gap-x-3 w-full px-4 py-2 items-center">
      <div className="px-2 rounded text-sm z-10 bg-white">Filters:</div>
      <div className="flex gap-x-2 overflow-scroll w-fit px-4 no-scrollbar">
        {updateFilters &&
          updateFilters.map((filter: FilterPops) => {
            if (Array.isArray(filter.value)) {
              return (
                <div className="flex gap-2 flex-shrink-0">
                  <div className="bg-blue-200 px-2 py-1 rounded text-sm">{filter.label}:</div>
                  {filter.value.map((value, index) => (
                    <div
                      key={index}
                      className="bg-gray-200 px-2 py-1 break-keep gap-1 rounded text-sm flex items-center cursor-pointer"
                      onClick={() => filter.handleDelete(removeValueFromArray(value, filter.value))}
                    >
                      <div className="w-fit">{value}</div>
                      <X className="h-4 w-4 cursor-pointer" />
                    </div>
                  ))}
                </div>
              );
            }
            return (
              <div className="flex gap-2 w-fit flex-shrink-0">
                <div className="bg-blue-200 px-2 py-1 rounded text-sm">{filter.label}:</div>
                <div
                  className="bg-gray-200 px-2 py-1 gap-1 flex-1 rounded text-sm w-fit flex items-center justify-between cursor-pointer"
                  onClick={() => filter.handleDelete(filter.value)}
                >
                  <div className="w-fit">{filter.value}</div>
                  <X className="h-4 w-4 cursor-pointer" />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

const ComboxBoxWrapper = ({ filter, handleChangeWrapper }: { filter: FilterPops; handleChangeWrapper: any }) => {
  const apiCall: ApiCallProps | undefined = filter.apiCall;

  const { data } = useFrappeGetCall(apiCall?.url as string, apiCall?.filters, undefined, apiCall?.options);

  return (
    <ComboxBox
      value={filter.value as string[]}
      label={filter.label as string}
      isMulti
      shouldFilter
      showSelected={false}
      onSelect={handleChangeWrapper}
      rightIcon={
        ((filter.value as string[])?.length ?? 0) > 0 && (
          <Badge className="px-1.5">{(filter.value as string[]).length}</Badge>
        )
      }
      leftIcon={<Filter className={cn("h-4 w-4", [].length != 0 && "fill-primary")} />}
      data={
        data?.message?.map((d: { name: string; label: string }) => ({
          label: d.label ? d.label : d.name,
          value: d.name,
        })) ?? []
      }
      className="text-primary border-dashed gap-x-2 font-normal w-fit"
    />
  );
};

export { ResourceHeaderSection };
