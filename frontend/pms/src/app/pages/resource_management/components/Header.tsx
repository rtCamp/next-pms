import { Button } from "@/app/components/ui/button";
import { ChevronLeft, ChevronRight, Filter, icons, Plus } from "lucide-react";
import { ComboxBox } from "@/app/components/comboBox";
import { Badge } from "@/app/components/ui/badge";
import { Header } from "@/app/layout/root";
import { cn } from "@/lib/utils";
import React, { MouseEventHandler } from "react";
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

interface FilterPops {
  queryParameterName: string;
  hide?: boolean;
  handleChange: any;
  data?: { value: string; label: string }[];
  type: "search" | "select-search" | "select" | "checkbox";
  value: string | number | boolean | string[] | undefined;
  defaultValue?: string | boolean | number;
  label?: string;
  className?: string;
}
interface ButtonPops {
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
  buttons: ButtonPops[];
}

const ResourceHeaderSection = ({ filters, buttons }: HeaderSectionProps) => {
  return (
    <Header className="flex items-center max-md:flex-col">
      <div id="filters" className="flex gap-x-3 max-md:gap-x-5  overflow-y-hidden max-md:w-full items-center">
        {filters &&
          filters.map((filter: FilterPops) => {
            if (filter.hide) {
              return <></>;
            }
            if (filter.type == "search") {
              return (
                <DeBounceInput
                  placeholder={filter.label}
                  value={filter.value}
                  deBounceValue={400}
                  className="max-w-40 min-w-40"
                  callback={filter.handleChange}
                />
              );
            }

            if (filter.type == "select-search") {
              return (
                <ComboxBox
                  value={filter.value as string[]}
                  label={filter.label}
                  isMulti
                  shouldFilter
                  showSelected={false}
                  onSelect={filter.handleChange}
                  rightIcon={(filter.value?.length ?? 0) > 0 && <Badge className="px-1.5">{filter.value.length}</Badge>}
                  leftIcon={<Filter className={cn("h-4 w-4", [].length != 0 && "fill-primary")} />}
                  // Need to fetch this
                  data={filter.data}
                  className="text-primary border-dashed gap-x-2 font-normal w-fit"
                />
              );
            }

            if (filter.type == "select") {
              return (
                <Select value={filter.value as string} onValueChange={filter.handleChange}>
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
                  <Checkbox
                    id="combineWeekHours"
                    checked={filter.value as CheckedState}
                    onClick={filter.handleChange}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {filter.label}
                  </label>
                </div>
              );
            }
          })}
      </div>

      <div id="date-filter" className="flex gap-x-2 max-md:p-1 max-md:w-full max-md:justify-between max-md:m-2">
        {buttons &&
          buttons.map((button: ButtonPops) => {
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

export { ResourceHeaderSection };
