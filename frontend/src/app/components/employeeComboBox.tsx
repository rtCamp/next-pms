/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";
import { ChevronDown, Check } from "lucide-react";

/**
 * Internal dependencies.
 */
import { Typography } from "@/app/components/typography";
import { Avatar, AvatarImage, AvatarFallback } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { cn } from "@/lib/utils";
import { Employee } from "@/types";

interface EmployeeComboProps {
  disabled?: boolean;
  value: string;
  onSelect: (name: string) => void;
  className?: string;
  label?: string;
  status?: Array<string>;
  employeeName?: string;
  pageLength?: number;
}

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
}: EmployeeComboProps) => {
  const length = pageLength != null ? pageLength : 20;
  const [search, setSearch] = useState<string>(employeeName ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState<string>(search);
  const [selectedValues, setSelectedValues] = useState<string>(value);
  const [employee, setEmployee] = useState<Employee | undefined>();
  const [open, setOpen] = useState(false);
  const { data: employees } = useFrappeGetCall(
    "next_pms.timesheet.api.employee.get_employee_list",
    { page_length: length, status: status, employee_name: debouncedSearch },
    undefined,
    {
      revalidateIfStale: false,
      revalidateOnMount: false,
    }
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
    const res = employees?.message.data.find((item: Employee) => item.name === selectedValues);
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
          className={cn(
            "items-center w-full gap-x-4 px-2 justify-between [&[data-state=open]>svg]:rotate-180 truncate",
            className
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

          <ChevronDown size={24} className="w-4 h-4 shrink-0 transition-transform duration-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search Employee" value={search} onValueChange={onInputChange} />
          <CommandEmpty>No data.</CommandEmpty>
          <CommandGroup>
            <CommandList>
              {employees?.message.data.map((item: Employee, index: number) => {
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
                    <Check className={cn("mr-2 h-4 w-4", isActive ? "opacity-100" : "opacity-0")} />
                    <Avatar>
                      <AvatarImage src={item.image} alt={item.employee_name} />
                      <AvatarFallback>{item.employee_name[0]}</AvatarFallback>
                    </Avatar>
                    <Typography variant="p">{item.employee_name}</Typography>
                  </CommandItem>
                );
              })}
            </CommandList>
          </CommandGroup>
          <Button variant="ghost" onClick={resetState} className="border-t rounded-none font-normal w-full">
            Clear Selection
          </Button>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default EmployeeCombo;
