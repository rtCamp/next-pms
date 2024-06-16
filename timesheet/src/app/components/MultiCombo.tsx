import { useEffect, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CirclePlus } from "./Icon";
import { Check } from "lucide-react";
import { cn } from "@/app/lib/utils";
interface MultiComboStateProps {
  label: string;
  value: string;
}

export function MultiCombo({
  comboData,
  buttonLabel,
  showSelectedValue = false,
  buttonClass = "",
  parentCallback,
}: {
  comboData: Array<MultiComboStateProps>;
  buttonLabel: string;
  showSelectedValue?: boolean;
  buttonClass?: string;
  parentCallback?: (data: any) => void;
}) {
  const [data, setData] = useState<Array<MultiComboStateProps>>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedValues, setSelectedValues] = useState<
    Array<MultiComboStateProps>
  >([]);

  useEffect(() => {
    setData(comboData);
  }, []);

  useEffect(() => {
    if (!openCombobox) {
      const values = selectedValues.map(({ value }) => value);
      parentCallback && parentCallback(values);
    }
  }, [openCombobox]);

  const toggleData = (data: MultiComboStateProps) => {
    setSelectedValues((item) =>
      !item.includes(data)
        ? [...item, data]
        : item.filter((l) => l.value !== data.value)
    );
  };
  const clearFilter = () => {
    setSelectedValues([]);
    setOpenCombobox(false);
  }
  return (
    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={openCombobox}
          className={`w-[200px] justify-center items-center gap-x-2 text-foreground ${buttonClass}`}
        >
          <CirclePlus />
          {showSelectedValue && selectedValues.length > 0 ? (
            <span className="truncate">
              {selectedValues.length === 1 && selectedValues[0].label}
              {selectedValues.length === 2 &&
                selectedValues.map(({ label }) => label).join(", ")}
              {selectedValues.length > 2 &&
                `${selectedValues.length} labels selected`}
            </span>
          ) : (
            buttonLabel
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <Command loop>
          <CommandInput placeholder={`Search for ${buttonLabel}...`} />
          <CommandList>
            <CommandEmpty>No {buttonLabel} found.</CommandEmpty>
            <CommandGroup>
              {data.map((item) => {
                const isActive = selectedValues.includes(item);
                return (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={() => toggleData(item)}
                    className={` ${
                      isActive ? "bg-primary " : ""
                    } aria-selected:bg-primary aria-selected:text-primary-foreground`}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isActive ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>

        <Button className="w-full" onClick={clearFilter}>
          Clear Filters
        </Button>
      </PopoverContent>
    </Popover>
  );
}
