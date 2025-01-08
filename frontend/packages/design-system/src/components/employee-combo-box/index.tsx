/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";
import { ChevronDown, Check } from "lucide-react";

/**
 * Internal dependencies.
 */
import { Typography } from "@design-system/components";
import { Avatar, AvatarImage, AvatarFallback } from "@design-system/components";
import { Button } from "@design-system/components";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@design-system/components";
import { Popover, PopoverContent, PopoverTrigger } from "@design-system/components";
import { cn } from "@design-system/utils";

export type EmployeeComboBoxProp = {
  disabled?: boolean;
  value: string;
  onSelect: (name: string) => void;
  className?: string;
  label?: string;
  status?: Array<string>;
  employeeName?: string;
  pageLength?: number;
};

export type Employee = {
  name: string;
  image: string;
  employee_name: string;
};

const EmployeeComboBox = ({
  disabled = false,
  value = "",
  onSelect,
  className,
  status,
  employeeName,
  pageLength,
  label = "Select Employee",
}: EmployeeComboBoxProp) => {
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
    }, 300);

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

          <ChevronDown size={24} className="shrink-0 transition-transform duration-400" />
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
                    <Check className={cn("mr-2 ", isActive ? "opacity-100" : "opacity-0")} />
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

export default EmployeeComboBox;
