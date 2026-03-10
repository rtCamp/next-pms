/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@next-pms/design-system/components";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { ChevronDown, Check, FolderDot } from "lucide-react";
/**
 * Internal dependencies.
 */

import { mergeClassNames } from "@/lib/utils";
import { Project } from "@/types";

interface ProjectComboBoxProps {
  disabled?: boolean;
  value: string;
  onSelect: (name: string) => void;
  className?: string;
  label?: string;
  status?: Array<string>;
  projectName?: string;
  pageLength?: number;
}

/**
 * Variation of combo box for selecting project.
 *
 * @param props Props passed to the component.
 * @param props.disabled Whether the combo box is disabled.
 * @param props.value Initial value of the combo box.
 * @param props.onSelect The function to call when an project is selected.
 * @param props.className The css class for combo box.
 * @param props.label The label for the combo box. Default is "Select Project".
 * @param props.status Option to filter the project based on status. ex: ["Open", "Complete","Cancelled"]
 * @returns JSX element
 */
const ProjectComboBox = ({
  disabled = false,
  value = "",
  onSelect,
  className,
  status,
  projectName,
  pageLength,
  label = "Select Project",
}: ProjectComboBoxProps) => {
  const length = pageLength != null ? pageLength : 20;
  const [search, setSearch] = useState<string>(projectName ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState<string>(search);
  const [selectedValues, setSelectedValues] = useState<string>(value);
  const [project, setProject] = useState<Project | undefined>();
  const [open, setOpen] = useState(false);

  const { data: projects } = useFrappeGetDocList("Project", {
    fields: ["name", "project_name"],
    filters: [
      ...(debouncedSearch ? [["project_name", "like", `%${debouncedSearch}%`]] : []),
      ...(status ? [["status", "=", status]] : []),
      ...(value && !debouncedSearch ? [["name", "=", value]] : []),
      ...(window.frappe?.boot?.global_filters.project || []),
    ],
    limit: length,
    orderBy: { field: "creation", order: "desc" },
  });

  const onProjectChange = (name: string) => {
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
    if (!projects) return;
    const res = projects?.find((item: Project) => item.name === selectedValues);
    setProject(res);
  }, [projects, selectedValues]);

  useEffect(() => {
    setSelectedValues(value);
  }, [value]);

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
    if (projectName) {
      setSearch(projectName);
    }
  }, [projectName]);
  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={mergeClassNames(
            "items-center w-full gap-x-4 px-2 justify-between [&[data-state=open]>svg]:rotate-180 truncate",
            className
          )}
        >
          {project ? (
            <span className="flex gap-x-2 items-center truncate pointer">
              <FolderDot className="h-4 w-4" />
              <Typography variant="p" className="truncate">
                {project?.project_name}
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
      <PopoverContent className="p-0 z-[1000]">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search Project" value={search} onValueChange={onInputChange} />
          <CommandEmpty>No data.</CommandEmpty>
          <CommandGroup>
            <CommandList>
              {projects?.map((item: Project, index: number) => {
                const isActive = selectedValues == item.name;
                return (
                  <CommandItem
                    key={index}
                    onSelect={() => {
                      onProjectChange(item.name);
                    }}
                    className="flex gap-x-2 text-primary font-normal cursor-pointer"
                    value={item.project_name}
                  >
                    <Check className={mergeClassNames("mr-2 h-4 w-4", isActive ? "opacity-100" : "opacity-0")} />
                    <Typography variant="p">{item.project_name}</Typography>
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

export default ProjectComboBox;
