import { Button } from "@/app/components/ui/button";
import { useFrappeGetCall } from "frappe-react-sdk";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Typography } from "@/app/components/typography";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/app/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { ChevronDown, Check } from "lucide-react";
import { Employee } from "@/types";

const EmployeeCombo = ({
  disabled = false,
  value = "",
  onSelect,
  className,
  status,
  label = "Select Employee",
}: {
  disabled?: boolean;
  value: string;
  onSelect: (name: string) => void;
  className?: string;
  label?: string;
  status?: [string];
}) => {
  const [selectedValues, setSelectedValues] = useState<string>(value);
  const [employee, setEmployee] = useState<Employee | undefined>();

  const { data: employees } = useFrappeGetCall(
    "next_pms.timesheet.api.employee.get_employee_list",
    status ? { status: status } : {},
    undefined,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );
  const onEmployeeChange = (name: string) => {
    setSelectedValues(name);
    onSelect(name);
  };
  const resetState = () => {
    setSelectedValues("");
    onSelect("");
  };
  useEffect(() => {
    if (!employees) return;
    const res = employees?.message.data.find((item: Employee) => item.name === selectedValues);
    setEmployee(res);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, selectedValues]);

  return (
    <Popover modal>
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

          <ChevronDown size={24} className="w-4 h-4 transition-transform duration-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Search Employee" />
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
