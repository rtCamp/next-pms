/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
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

export type EmployeeComboBoxProps = {
  disabled?: boolean;
  value: string;
  onSelect: (name: string) => void;
  onSearch?: (search: string) => void;
  shouldFilter?: boolean;
  className?: string;
  label?: string;
  data: Array<Employee>;
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
  data,
  onSearch,
  shouldFilter = true,
  label = "Select Employee",
}: EmployeeComboBoxProps) => {
  const [search, setSearch] = useState<string>("");
  const [selectedValue, setSelectedValue] = useState<string>(value);
  const [employee, setEmployee] = useState<Employee | undefined>();
  const [open, setOpen] = useState(false);

  const onEmployeeChange = (name: string) => {
    setSelectedValue(name);
    onSelect(name);
    setOpen(false);
  };
  const resetState = () => {
    setSelectedValue("");
    onSelect("");
    setOpen(false);
  };
  useEffect(() => {
    const res = data.find((item: Employee) => item.name === selectedValue);
    setEmployee(res);
  }, [data, selectedValue]);

  useEffect(() => setSelectedValue(value), [value]);
  const onInputChange = (search: string) => {
    setSearch(search);
  };
  useEffect(() => {
    if (!onSearch) return;
    const handler = setTimeout(() => {
      onSearch(search);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [onSearch, search]);

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
        <Command shouldFilter={shouldFilter}>
          <CommandInput placeholder="Search Employee" value={search} onValueChange={onInputChange} />
          <CommandEmpty>No data.</CommandEmpty>
          <CommandGroup>
            <CommandList>
              {data.map((item: Employee, index: number) => {
                const isActive = selectedValue == item.name;
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
