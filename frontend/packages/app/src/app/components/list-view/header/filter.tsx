/* eslint-disable @typescript-eslint/no-unused-expressions */
/**
 * External dependencies.
 */
import { useEffect } from "react";
import {
  DeBouncedInput,
  ComboBox,
  Badge,
  Checkbox,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  CheckedState,
} from "@next-pms/design-system/components";
import { useQueryParam } from "@next-pms/hooks";
import { Filter as Funnel } from "lucide-react";

/**
 * Internal dependencies.
 */
import EmployeeCombo from "@/app/components/employeeComboBox";
import ComboBoxWrapper from "@/app/components/list-view/header/comboBoxWrapper";
import type { FilterPops } from "@/app/components/list-view/types";
import { cn } from "@/lib/utils";

/**
 * Filter component is responsible for rendering the filter section of the list view or pages.
 * @param {Object} props - The props for the component.
 * @param {Object} props.filter - The filter object.
 * @param {String} props.filter.type - The type of the filter.
 * @param {String} props.filter.label - The label of the filter.
 * @param {String} props.filter.queryParameterName - The query parameter name.
 * @param {String} props.filter.queryParameterDefault - The default value of the query parameter.
 * @param {String} props.filter.value - The value of the filter.
 * @param {Function} props.filter.handleChange - The function to handle the change of the filter.
 * @returns React.FC
 */
export const Filter = ({ filter }: { filter: FilterPops }) => {
  const [, setQueryParam] = useQueryParam(filter.queryParameterName ?? "", filter.queryParameterDefault);

  const handleChangeWrapper = (value: string | CheckedState | string[]) => {
    /* Make sure to update query parameters based on changes. */
    if (filter.type != "custom-filter") {
      setQueryParam(value);
    }
    filter.handleChange && filter.handleChange(value);
  };

  useEffect(() => {
    /** This will make sure to update the query parameter state if some filter is removed from the URL. */
    if (filter.type != "custom-filter") {
      setQueryParam(filter.value as string | CheckedState | string[]);
    }
  }, [filter.value, setQueryParam]);

  if (filter.type == "search") {
    return (
      <DeBouncedInput
        placeholder={filter.label}
        value={filter.value as string}
        deBounceValue={300}
        callback={(e) => handleChangeWrapper(e.target.value)}
        className={filter.className}
      />
    );
  }
  if (filter.type === "search-employee") {
    return (
      <EmployeeCombo
        value={filter.value as string}
        label={filter.label ?? "Reporting Manager"}
        status={filter.employeeComboStatus ?? []}
        onSelect={handleChangeWrapper}
        employeeName={filter?.employeeName}
        className={cn("border-dashed min-w-48 w-full max-w-48", filter.className)}
      />
    );
  }
  if (filter.type === "custom-filter") {
    return filter.customFilterComponent;
  }
  if (filter.type == "select-search") {
    // If we do not have apicall in dynamic search then do nothing.
    if (!filter.apiCall) {
      return <></>;
    }
    return <ComboBoxWrapper filter={filter} handleChangeWrapper={handleChangeWrapper} />;
  }
  if (filter.type == "select-list") {
    return (
      <ComboBox
        value={filter.value as string[]}
        label={filter.label as string}
        isMulti={filter?.isMultiComboBox ?? false}
        shouldFilter={filter?.shouldFilterComboBox ?? false}
        showSelected={false}
        onSelect={handleChangeWrapper}
        rightIcon={
          filter?.isMultiComboBox
            ? ((filter.value as string[])?.length ?? 0) > 0 && (
                <Badge className="p-0 justify-center w-5 h-5">{(filter.value as string[]).length}</Badge>
              )
            : (filter.value?.toString()?.length ?? 0) > 0 && <Badge className="p-0 justify-center w-5 h-5">1</Badge>
        }
        leftIcon={
          <Funnel
            className={cn(
              "h-4 w-4",
              filter?.isMultiComboBox
                ? (filter.value as string[])?.length != 0 && "fill-primary"
                : (filter.value?.toString()?.length ?? 0) > 0 && "fill-primary"
            )}
          />
        }
        data={
          filter.data?.map((d: { value: string; label: string; disabled?: boolean }) => ({
            label: d.label,
            value: d.value,
            disabled: d.disabled,
          })) ?? []
        }
        onSearch={filter?.onSearch}
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
        <SelectContent className={filter.className}>
          <SelectGroup>
            <SelectLabel>{filter.label}</SelectLabel>
            {filter.data &&
              filter.data.map((item, index) => {
                return (
                  <SelectItem key={index} value={item.value}>
                    {item.label}
                  </SelectItem>
                );
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
          onClick={(e) => handleChangeWrapper((e.target as HTMLInputElement).checked)}
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
