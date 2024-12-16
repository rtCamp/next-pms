import { Button } from "@/app/components/ui/button";
import { Filter } from "lucide-react";
import { ComboxBox } from "@/app/components/comboBox";
import { Badge } from "@/app/components/ui/badge";
import { Header } from "@/app/layout/root";
import { cn } from "@/lib/utils";
import React from "react";
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

interface FilterPops {
  queryParameterName: string;
  queryParameterDefault: string | string[] | boolean | undefined;
  hide?: boolean;
  handleChange: any;
  data?: { value: string; label: string }[];
  type: "search" | "select-search" | "select" | "checkbox" | "search-employee";
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
    <Header className="flex items-center max-md:flex-col">
      <div id="filters" className="flex gap-x-3 max-md:gap-x-5 overflow-y-hidden max-md:w-full items-center">
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
  );
};

const RenderFilter = ({ filter }: { filter: FilterPops }) => {
  const [queryParam, setQueryParam] = useQueryParamsState(filter.queryParameterName, filter.queryParameterDefault);

  const handleChange = (value: string | CheckedState | string[]) => {
    setQueryParam(value);
    filter.handleChange && filter.handleChange(value);
  };

  if (filter.type == "search") {
    return (
      <DeBounceInput
        placeholder={filter.label}
        value={filter.value as string}
        deBounceValue={400}
        className="max-w-60 min-w-60"
        callback={(e) => handleChange(e.target.value)}
      />
    );
  }

  if (filter.type === "search-employee") {
    return (
      <EmployeeCombo
        value={filter.value as string}
        label="Reporting Manager"
        status={["Active"]}
        onSelect={handleChange}
        className="border-dashed min-w-48 w-full max-w-48"
      />
    );
  }

  if (filter.type == "select-search") {
    if (!filter.apiCall) {
      return <></>;
    }
    return <ComboxBoxWrapper filter={{ ...filter, handleChange: handleChange }} />;
  }

  if (filter.type == "select") {
    return (
      <Select value={filter.value as string} onValueChange={handleChange}>
        <SelectTrigger className="w-[180px]">
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
        <Checkbox id="combineWeekHours" checked={filter.value as CheckedState} onClick={filter.handleChange} />
        <label
          htmlFor="terms"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {filter.label}
        </label>
      </div>
    );
  }
};

const ComboxBoxWrapper = ({ filter }: { filter: FilterPops }) => {
  const apiCall: ApiCallProps | undefined = filter.apiCall;

  const { data } = useFrappeGetCall(apiCall?.url as string, apiCall?.filters, undefined, apiCall?.options);

  return (
    <ComboxBox
      value={filter.value as string[]}
      label={filter.label as string}
      isMulti
      shouldFilter
      showSelected={false}
      onSelect={filter.handleChange}
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
