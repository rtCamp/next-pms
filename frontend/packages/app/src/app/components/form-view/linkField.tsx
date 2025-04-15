/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import {
  Typography,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  useToast,
  Spinner,
} from "@next-pms/design-system/components";
import { useFrappeGetCall } from "frappe-react-sdk";
import { ArrowRight } from "lucide-react";
/**
 * Internal dependencies.
 */
import { mergeClassNames, parseFrappeErrorMsg } from "@/lib/utils";
import { Field } from "./types";

interface LinkFieldProps {
  field: Field;
  value: string;
  isReadOnly?: boolean;
  onSelect?: (value: string) => void;
}

const LinkField = ({ field, value, isReadOnly, onSelect }: LinkFieldProps) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value);

  const [filteredOptions, setFilteredOptions] = useState<Array<Record<"name", string>>>([]);

  const handleSelect = (val: string) => {
    setInput(val);
    onSelect?.(val);
    setOpen(false);
  };

  if (isReadOnly) {
    return (
      <div
        className={mergeClassNames(
          "group flex items-center gap-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm  justify-between",
          isReadOnly && "border-gray-100 text-gray-400"
        )}
      >
        <Typography className="shrink-0">{input}</Typography>
        {input && (
          <a href={field.link?.route} target="_blank">
            <ArrowRight
              className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
              aria-hidden="true"
            />
          </a>
        )}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className="group flex items-center gap-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-text justify-between"
          onClick={() => setOpen(true)}
        >
          <Typography className="shrink-0">{input}</Typography>
          {input && (
            <a href={field.link?.route} target="_blank" onClick={(e) => e.stopPropagation()}>
              <ArrowRight
                className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                aria-hidden="true"
              />
            </a>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 w-full max-md:min-w-[250px] max-lg:min-w-[450px] lg:min-w-[400px]">
        <Command>
          <CommandInput
            placeholder={`Search ${field?.link?.doctype ? field.link.doctype : field.options}`}
            value={input}
            onValueChange={setInput}
          />
          <CommandList>
            <CommandGroup>
              {open && (
                <LinkFieldOptions
                  field={field}
                  input={input}
                  setFilteredOptions={setFilteredOptions}
                  filteredOptions={filteredOptions}
                  onSelect={handleSelect}
                />
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default LinkField;

interface LinkFieldOptionsProps {
  field: Field;
  input: string;
  setFilteredOptions: React.Dispatch<React.SetStateAction<Array<Record<"name", string>>>>;
  filteredOptions: Array<Record<"name", string>>;
  onSelect: (val: string) => void;
}

const LinkFieldOptions = ({ field, input, setFilteredOptions, filteredOptions, onSelect }: LinkFieldOptionsProps) => {
  const { toast } = useToast();

  const { data, isLoading, error } = useFrappeGetCall("frappe.client.get_list", {
    doctype: field.options,
    fields: ["name"],
    filters: [["name", "like", `%${input}%`]],
    limit_page_length: 20,
  });

  useEffect(() => {
    if (data?.message) {
      setFilteredOptions(data.message);
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
  }, [data, error]);

  if (isLoading) {
    return (
      <div className="my-5">
        <Spinner />
      </div>
    );
  }

  if (filteredOptions.length === 0) {
    return <CommandItem disabled>No results</CommandItem>;
  }

  return (
    <>
      {filteredOptions.map((option) => (
        <CommandItem className="cursor-pointer" key={option.name} onSelect={() => onSelect(option.name)}>
          {option.name}
        </CommandItem>
      ))}
    </>
  );
};
