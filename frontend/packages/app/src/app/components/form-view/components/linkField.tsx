/**
 * External dependencies.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { deBounce } from "@next-pms/design-system";
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
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@next-pms/design-system/components";
import { useFrappeGetCall } from "frappe-react-sdk";
import { ArrowRight } from "lucide-react";
/**
 * Internal dependencies.
 */
import { mergeClassNames, parseFrappeErrorMsg } from "@/lib/utils";
import { Field } from "../types";

interface LinkFieldProps {
  field: Field;
  value: string;
  isReadOnly?: boolean;
  onSelect?: (value: string) => void;
  popoverClassName?: string;
}

/**
 * LinkField Component
 * @description This component renders a linkField which behaves similar to frappe-link-field
 * contains different set of fields.
 * @param field Field
 * @param value Value of the field
 * @param isReadOnly Readonly flag
 * @param onSelect Function triggered when a item is selected from the combo-box, returns a selected item string
 * @returns A JSX Component
 */
const LinkField = ({
  field,
  value,
  isReadOnly,
  onSelect,
  popoverClassName,
}: LinkFieldProps) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value);
  const [debouncedInput, setDebouncedInput] = useState(value);
  const debouncedSetInput = useMemo(
    () => deBounce((val: string) => setDebouncedInput(val), 300),
    [],
  );

  useEffect(() => {
    setInput(value);
    setDebouncedInput(value);
  }, [value]);

  const didSelectRef = useRef(false);

  const [filteredOptions, setFilteredOptions] = useState<
    Array<Record<"name" | "full_name" | "employee_name" | "user_image", string>>
  >([]);

  const handleSelect = (val: string) => {
    didSelectRef.current = true;
    setInput(val);
    onSelect?.(val);
    setOpen(false);
  };

  const handlePopoverOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (!didSelectRef.current) {
        setInput(value);
      }
      didSelectRef.current = false;
    }
    setOpen(nextOpen);
  };

  if (isReadOnly) {
    return (
      <div
        className={mergeClassNames(
          "group flex items-center gap-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm  justify-between",
          isReadOnly && "border-gray-100 text-gray-400 dark:border-input",
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
    <Popover open={open} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>
        <div
          className="group flex items-center gap-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-text justify-between"
          onClick={() => setOpen(true)}
        >
          <Typography className="shrink-0">{input}</Typography>
          {input && (
            <a
              href={field.link?.route}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
            >
              <ArrowRight
                className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                aria-hidden="true"
              />
            </a>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={mergeClassNames(
          "z-[1000000] p-0 w-full max-md:min-w-[250px] max-lg:min-w-[450px] lg:min-w-[400px]",
          popoverClassName,
        )}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${field?.link?.doctype ? field.link.doctype : field.options}`}
            value={input}
            onValueChange={(nextVal) => {
              setInput(nextVal);
              debouncedSetInput(nextVal);
            }}
          />
          <CommandList>
            <CommandGroup>
              {open && (
                <LinkFieldOptions
                  field={field}
                  input={debouncedInput}
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
  setFilteredOptions: React.Dispatch<
    React.SetStateAction<
      Array<
        Record<"name" | "full_name" | "employee_name" | "user_image", string>
      >
    >
  >;
  filteredOptions: Array<
    Record<"name" | "full_name" | "employee_name" | "user_image", string>
  >;
  onSelect: (val: string) => void;
}

/**
 * LinkFieldOptions Component
 * @description This component renders set of CommandItems
 * @returns A JSX Component
 */
const LinkFieldOptions = ({
  field,
  input,
  setFilteredOptions,
  filteredOptions,
  onSelect,
}: LinkFieldOptionsProps) => {
  const { toast } = useToast();

  const { data, isLoading, error } = useFrappeGetCall(
    "frappe.client.get_list",
    {
      doctype: field.options,
      fields: [
        "name",
        ...(field.options === "User"
          ? ["full_name", "user_image"]
          : field.options === "Employee"
            ? ["employee_name"]
            : []),
      ],
      filters: [["name", "like", `%${input}%`]],
      limit_page_length: 20,
    },
  );

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
        <CommandItem
          className="cursor-pointer flex gap-2"
          key={option.name}
          onSelect={() => onSelect(option.name)}
        >
          {field.options === "User" && (
            <Avatar className="size-8">
              <AvatarImage src={option.user_image} />
              <AvatarFallback>
                {option?.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex flex-col items-start">
            <Typography
              variant="p"
              className={
                option.full_name || (option.employee_name && "font-semibold")
              }
            >
              {option.name}
            </Typography>
            {option.full_name && (
              <Typography variant="p">{option.full_name}</Typography>
            )}
            {option.employee_name && (
              <Typography variant="p">{option.employee_name}</Typography>
            )}
          </div>
        </CommandItem>
      ))}
    </>
  );
};
