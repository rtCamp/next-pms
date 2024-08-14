import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { Check } from "lucide-react";
import { Typography } from "./typography";
import { useEffect, useState } from "react";
import { Checkbox } from "@/app/components/ui/checkbox";
import { cn, deBounce } from "@/lib/utils";

interface ComboBoxProps {
  isOpen?: boolean;
  data?: Array<{ label: string; value: string; disabled?: boolean; description?: string }>;
  onSelect?: (value: string | string[]) => void;
  disabled?: boolean;
  label: string;
  isMulti?: boolean;
  value?: string[];
  onSearch?: (searchTerm: string) => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  showSelected?: boolean;
}

export const ComboxBox = ({
  isOpen = false,
  data = [],
  onSelect,
  disabled = false,
  label = "Search",
  isMulti = false,
  value,
  onSearch,
  leftIcon,
  rightIcon,
  className = "",
  showSelected = false,
}: ComboBoxProps) => {
  const [selectedValues, setSelectedValues] = useState<string[]>(value ?? []);
  const [open, setOpen] = useState(isOpen);
  const clearFilter = () => {
    setSelectedValues([]);
    onSelect && onSelect(isMulti ? [] : "");
    setOpen(!open);
  };
  const handleComboClose = () => {
    setOpen(!open);
  };
  const handleSelect = (value: string) => {
    if (!isMulti) {
      setSelectedValues([value]);
      onSelect && onSelect(value);
      setOpen(false);
      return;
    }
    let values = [...selectedValues];
    if (values.includes(value)) {
      values = values.filter((val) => val !== value);
    } else {
      values.push(value);
    }
    setSelectedValues(values);
  };
  const hasValue = selectedValues.length > 0;
  const selectedValue = () => {
    if (selectedValues.length === 1) {
      return data.find((item) => item.value === selectedValues[0])?.label;
    }
    return `${selectedValues.length} items selected`;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onInputChange = deBounce((search) => {
    onSearch && onSearch(search);
  }, 1000);
  useEffect(() => {
    if (open) return;
    if (isMulti && selectedValues.length > 0) {
      onSelect && onSelect(selectedValues);
    }
  }, [isMulti, onSelect, open, selectedValues]);
  return (
    <Popover modal open={open} onOpenChange={handleComboClose}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-between w-full text-slate-400", hasValue && "text-primary", className)}
          disabled={disabled}
        >
          {leftIcon}
          <Typography variant="p" className="truncate max-w-md">
            {!hasValue || !showSelected ? label : selectedValue()}
          </Typography>
          {rightIcon}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-96">
        <Command shouldFilter={false}>
          <CommandInput placeholder={label} onValueChange={onInputChange} />
          <CommandEmpty>No data.</CommandEmpty>
          <CommandGroup>
            <CommandList>
              {data.map((item, index) => {
                const isActive = selectedValues.includes(item.value);
                return (
                  <CommandItem
                    key={index}
                    onSelect={handleSelect}
                    className="flex gap-x-2 text-primary"
                    value={item.value}
                  >
                    {!isMulti ? (
                      <Check className={cn("mr-2 h-4 w-4", isActive ? "opacity-100" : "opacity-0")} />
                    ) : (
                      <Checkbox checked={isActive} />
                    )}

                    <div>
                      <Typography variant="p">{item.label}</Typography>
                      <Typography variant="small">{item.description}</Typography>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandList>
          </CommandGroup>
        </Command>
        <Button variant="ghost" onClick={clearFilter} className="border-t rounded-none font-normal w-full">
          Clear Filters
        </Button>
      </PopoverContent>
    </Popover>
  );
};
