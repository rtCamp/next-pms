/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import {
  Typography,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
} from "@next-pms/design-system/components";
import { useFrappeGetCall } from "frappe-react-sdk";
import { ChevronDown, Check } from "lucide-react";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "@/lib/utils";
import type { Employee } from "@/types";
import type { EmployeeComboProps } from "./types";

/**
 * Variation of combo box for selecting employee.
 *
 * @param props Props passed to the component.
 * @param props.disabled Whether the combo box is disabled.
 * @param props.value Initial value of the combo box.
 * @param props.onSelect The function to call when an employee is selected.
 * @param props.className The css class for combo box.
 * @param props.label The label for the combo box. Default is "Select Employee".
 * @param props.status Option to filter the employees based on status. ex: ["Active", "Inactive"]
 * @param ignoreDefaultFilters A flag to indicate whether to ignore all default filters
 * applied to employees based on their status.
 * @returns JSX element
 */
const EmployeeCombo = ({
  disabled = false,
  value = "",
  onSelect,
  className,
  status,
  employeeName,
  pageLength,
  label = "Select Employee",
  ignoreDefaultFilters = false,
}: EmployeeComboProps) => {
  const length = pageLength != null ? pageLength : 20;
  const [search, setSearch] = useState<string>(employeeName ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState<string>(search);
  const [selectedValues, setSelectedValues] = useState<string>(value);
  const [employee, setEmployee] = useState<Employee | undefined>();
  const [open, setOpen] = useState(false);
  const { data: employees, isLoading } = useFrappeGetCall(
    "next_pms.timesheet.api.employee.get_employee_list",
    {
      page_length: length,
      status: status,
      employee_name: debouncedSearch,
      ignore_default_filters: ignoreDefaultFilters,
    },
    undefined,
    {
      revalidateIfStale: false,
    },
  );
  const onEmployeeChange = (name: string) => {
    setSelectedValues(name);
    onSelect(name);
    setOpen(false);
  };
  const resetState = () => {
    setSelectedValues("");
    onSelect("");
    setOpen(false);
  };
  useEffect(() => {
    if (!employees) return;
    const res = employees?.message.data.find(
      (item: Employee) => item.name === selectedValues,
    );
    setEmployee(res);
  }, [employees, selectedValues]);

  useEffect(() => setSelectedValues(value), [value]);
  const onInputChange = (search: string) => {
    setSearch(search);
  };
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400); // 300ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  useEffect(() => {
    if (employeeName) {
      setSearch(employeeName);
    }
  }, [employeeName]);
  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={mergeClassNames(
            "items-center w-full gap-x-4 px-2 justify-between [&[data-state=open]>svg]:rotate-180 truncate",
            className,
          )}
        >
          {employee ? (
            <span className="flex gap-x-2 items-center truncate pointer">
              <Avatar className="w-8 h-8">
                <AvatarImage src={employee?.image} alt="image" />
                <AvatarFallback>{employee?.employee_name[0]}</AvatarFallback>
              </Avatar>
              <Typography variant="p" className="truncate">
                {employee?.employee_name}
              </Typography>
            </span>
          ) : (
            <Typography variant="p" className="text-gray-400 truncate">
              {label}
            </Typography>
          )}

          <ChevronDown
            size={24}
            className="w-4 h-4 shrink-0 transition-transform duration-400"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 z-[1000]">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search Employee"
            value={search}
            onValueChange={onInputChange}
          />
          {isLoading ? (
            <Spinner className="py-6" />
          ) : (
            <CommandEmpty>No data found.</CommandEmpty>
          )}
          <CommandGroup>
            <CommandList>
              {!isLoading &&
                employees?.message.data.map((item: Employee, index: number) => {
                  const isActive = selectedValues == item.name;
                  return (
                    <CommandItem
                      key={index}
                      onSelect={() => {
                        onEmployeeChange(item.name);
                      }}
                      className="flex gap-x-2 text-primary font-normal cursor-pointer"
                      value={item.employee_name}
                    >
                      <Check
                        className={mergeClassNames(
                          "mr-2 h-4 w-4",
                          isActive ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <Avatar>
                        <AvatarImage
                          src={item.image}
                          alt={item.employee_name}
                        />
                        <AvatarFallback>{item.employee_name[0]}</AvatarFallback>
                      </Avatar>
                      <Typography variant="p">{item.employee_name}</Typography>
                    </CommandItem>
                  );
                })}
            </CommandList>
          </CommandGroup>
          <Button
            variant="ghost"
            onClick={resetState}
            className="border-t rounded-none font-normal w-full"
          >
            Clear Selection
          </Button>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default EmployeeCombo;
