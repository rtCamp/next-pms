/**
 * External Dependencies
 */
import { useEffect, useState } from "react";
import { Check } from "lucide-react";

/**
 * Internal Dependencies
 */
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { cn, deBounce } from "@/lib/utils";
import { Typography } from "./typography";

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
  onunSelect?: () => void;
  className?: string;
  showSelected?: boolean;
  shouldFilter?: boolean;
  deBounceTime?: number;
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
  onunSelect,
  leftIcon,
  rightIcon,
  className = "",
  showSelected = false,
  shouldFilter = false,
  deBounceTime = 400,
}: ComboBoxProps) => {
  const [selectedValues, setSelectedValues] = useState<string[]>(typeof value === "string" ? [value] : value ?? []);
  useEffect(() => {
    setSelectedValues(typeof value === "string" ? [value] : value ?? []);
  }, [value]);
  const [open, setOpen] = useState(isOpen);
  const clearFilter = () => {
    if (selectedValues.length == 0) {
      return;
    }
    setSelectedValues([]);
    onSelect && onSelect([]);
    setOpen(!open);
  };
  const handleComboClose = () => {
    setOpen(!open);
  };
  const handleSelect = (value: string) => {
    if (!isMulti) {
      if (selectedValues.includes(value)) return clearFilter();
      setSelectedValues([value]);
      onSelect && onSelect([value]);
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
    onSelect && onSelect(values);
  };

  useEffect(() => {
    if (selectedValues.length == 0) {
      onunSelect && onunSelect();
    }
  }, [onunSelect, selectedValues.length]);

  const hasValue = selectedValues.length > 0;
  const selectedValue = () => {
    if (selectedValues.length === 1) {
      return data.find((item) => item.value === selectedValues[0])?.label;
    }
    return `${selectedValues.length} items selected`;
  };

  const onInputChange = deBounce((search) => {
    onSearch && onSearch(search);
  }, deBounceTime);

  return (
    <Popover modal open={open} onOpenChange={handleComboClose}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-between w-full text-slate-400", hasValue && "text-primary", className)}
          disabled={disabled}
        >
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <Typography variant="p" className="truncate max-w-md">
            {!hasValue || !showSelected ? label : selectedValue()}
          </Typography>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-96">
        <Command
          shouldFilter={shouldFilter}
          filter={(value: string, search: string, keywords?: string[]) => {
            if (!keywords) return 0;
            const extendValue = value + " " + keywords.join(" ");
            if (extendValue.toLowerCase().includes(search.toLowerCase())) {
              return 1;
            }
            return 0;
          }}
        >
          <CommandInput placeholder={label} onValueChange={onInputChange} />
          <CommandEmpty>No data.</CommandEmpty>
          <CommandGroup>
            <CommandList>
              {data.length != 0 &&
                data.map((item, index) => {
                  const isActive = selectedValues.includes(item.value);
                  return (
                    <CommandItem
                      key={index}
                      keywords={[item.label, item.value]}
                      onSelect={handleSelect}
                      className="flex gap-x-2 text-primary cursor-pointer"
                      value={item.value}
                    >
                      {!isMulti ? (
                        <Check className={cn("mr-2 h-4 w-4", isActive ? "opacity-100" : "opacity-0")} />
                      ) : (
                        <Checkbox checked={isActive} />
                      )}

                      <div className="flex flex-col w-full overflow-hidden">
                        <Typography className="truncate" variant="p">
                          {item.label}
                        </Typography>
                        {item?.description && (
                          <Typography className="truncate" variant="small">
                            {item?.description}
                          </Typography>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
            </CommandList>
          </CommandGroup>
          <Button variant="ghost" onClick={clearFilter} className="border-t rounded-none font-normal w-full">
            Clear Selection
          </Button>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
