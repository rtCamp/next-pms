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
import { Search } from "lucide-react";
import { Typography } from "./typography";
import { useState } from "react";
import { Checkbox } from "@/app/components/ui/checkbox";
import { cn, deBounce } from "@/lib/utils";

interface ComboBoxProps {
  data?: Array<{ label: string; value: string; disabled?: boolean; description?: string }>;
  onSelect?: (value: string) => void;
  disabled?: boolean;
  label: string;
  isMulti?: boolean;
  value?: string[];
  onSearch?: (searchTerm: string) => void;
}

export const ComboxBox = ({
  data = [],
  onSelect,
  disabled = false,
  label = "Search",
  isMulti = false,
  value,
  onSearch,
}: ComboBoxProps) => {
  const [selectedValues, setSelectedValues] = useState<string[]>(value ?? []);

  const clearFilter = () => {
    setSelectedValues([]);
  };
  const handleSelect = (value: string) => {
    if (!isMulti) {
      setSelectedValues([value]);
      onSelect && onSelect(value);
      return;
    }

    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter((val) => val !== value));
    } else {
      setSelectedValues([...selectedValues, value]);
    }
    onSelect && onSelect(value);
  };
  const hasValue = selectedValues.length > 0;
  const selectedValue = () => {
    if (selectedValues.length === 1) {
      return data.find((item) => item.value === selectedValues[0])?.label;
    }
    return `${selectedValues.length} selected`;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onInputChange = deBounce((search) => {
    onSearch && onSearch(search);
  }, 1000);
  
  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-between w-full" disabled={disabled}>
          <Typography variant="p" className={cn("text-slate-400", hasValue && "text-primary")}>
            {!hasValue ? label : selectedValue()}
          </Typography>
          <Search className="h-4 w-4 stroke-slate-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
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
                    <Checkbox checked={isActive} />
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
        <Button variant="outline" onClick={clearFilter} className="w-full">
          Clear Filters
        </Button>
      </PopoverContent>
    </Popover>
  );
};
