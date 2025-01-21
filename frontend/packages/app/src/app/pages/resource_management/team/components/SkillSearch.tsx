/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Badge,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  DeBouncedInput,
  Typography,
} from "@next-pms/design-system/components";
import { useFrappeGetCall } from "frappe-react-sdk";
import { Filter as Funnel, Search, Star, X } from "lucide-react";

/**
 * Internal dependencies.
 */
import { cn } from "@/lib/utils";
import { RootState } from "@/store";
import { setSkillSearch, Skill, SkillData } from "@/store/resource_management/team";

// Comparison options map with descriptions
const COMPARISON_OPTIONS = {
  equals: { value: "=", label: "=" },
  greater_than: { value: ">", label: ">" },
  greater_than_equals: { value: ">=", label: ">=" },
  less_than: { value: "<", label: "<" },
  less_than_equals: { value: "<=", label: "<=" },
} as const;

const SkillSearch = ({
  onSubmit,
  setSkillSearchParam,
}: {
  onSubmit: () => void;
  setSkillSearchParam: (skills: Skill[]) => void;
}) => {
  const resourceTeamState = useSelector((state: RootState) => state.resource_team);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const dispatch = useDispatch();
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>(resourceTeamState?.skillSearch || []);

  const { data } = useFrappeGetCall(
    "frappe.client.get_list",
    {
      doctype: "Skill",
      filters: [["name", "like", `%${searchQuery}%`]],
      fields: ["name"],
      limit_page_length: 20,
    },
    undefined,
    { revalidateOnMount: false }
  );

  useEffect(() => {
    if (data) {
      if (searchQuery == "") {
        return;
      }
      setSkills(data.message);
    }
  }, [data, searchQuery]);

  const addSkill = (skill: { name: string }) => {
    if (!selectedSkills.find((s) => s.name === skill.name)) {
      setSelectedSkills([
        {
          ...skill,
          proficiency: 0.2, //default proficiency is 0.2 stars
          operator: COMPARISON_OPTIONS.greater_than_equals.value,
        },
        ...selectedSkills,
      ]);
    }
    setSearchQuery("");
    setSkills([]);
  };

  const removeSkill = (skillId: string) => {
    const updatedSkills = selectedSkills.filter((skill) => skill.name !== skillId);
    setSelectedSkills(updatedSkills);
    dispatch(setSkillSearch(updatedSkills));
  };

  const updateSkillComparison = (skillId: string, operator: string) => {
    setSelectedSkills(selectedSkills.map((skill) => (skill.name === skillId ? { ...skill, operator } : skill)));
  };

  const updateSkillProficiency = (skillId: string, stars: number) => {
    // Convert stars to proficiency value (e.g., 1 star = 0.2, 5 stars = 1.0)
    const proficiency = stars / 5;
    setSelectedSkills(selectedSkills.map((skill) => (skill.name === skillId ? { ...skill, proficiency } : skill)));
  };

  const handleSearchClick = () => {
    dispatch(setSkillSearch(selectedSkills));
    onSubmit();
    setIsPopoverOpen(false);
  };

  useEffect(() => {
    if (resourceTeamState.skillSearch) {
      setSkillSearchParam(resourceTeamState.skillSearch);
    }
  }, [resourceTeamState.skillSearch, setSkillSearchParam]);

  return (
    <Popover
      open={isPopoverOpen}
      onOpenChange={(value) => {
        if (!value) {
          setSelectedSkills([]);
        } else {
          setSelectedSkills(resourceTeamState?.skillSearch || []);
        }
        setIsPopoverOpen(value);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" className="border-dashed gap-x-2">
          <Funnel className={cn("h-4 w-4", resourceTeamState?.skillSearch!.length > 0 && "fill-primary")} />
          <Typography variant="p" className="truncate max-w-md">
            Skill
          </Typography>
          {resourceTeamState?.skillSearch!.length > 0 && (
            <Badge className="p-0 justify-center w-5 h-5">{resourceTeamState?.skillSearch?.length}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div>
          <h1>Skill Search</h1>
        </div>

        <div className="space-y-4 pt-4">
          {/* SkillSearch Input */}
          <div className="relative w-full">
            <DeBouncedInput
              placeholder="Search skills..."
              value={searchQuery}
              deBounceValue={300}
              callback={(e) => setSearchQuery(e.target.value)}
              className={cn("w-full min-w-full", skills.length > 0 && "[&>input]:rounded-b-none")}
            />
            {/* Skill suggestion */}
            {skills.length > 0 && (
              <div
                className={cn(
                  "absolute z-10 w-full max-h-[200px] overflow-y-auto rounded-md border bg-background shadow-md",
                  skills.length > 0 && "border-t-0 rounded-t-none"
                )}
              >
                {skills.map((skill) => (
                  <button
                    key={skill.name}
                    onClick={() => addSkill(skill)}
                    className="w-full px-4 py-2 text-sm text-left hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Selected Skills */}
          <div className="max-h-44 overflow-y-auto space-y-2">
            {selectedSkills.map((skill) => (
              <div key={skill.name} className="flex items-stretch gap-3">
                {/* Skill Name */}
                <div
                  className="font-medium bg-gray-100 border h-full rounded-md p-1 px-2 w-20 truncate text-sm"
                  title={skill.name}
                >
                  <Typography variant="p" className="truncate max-w-md">
                    {skill.name}
                  </Typography>
                </div>

                {/* Operator Select Menu */}
                <Select value={skill.operator} onValueChange={(value) => updateSkillComparison(skill.name, value)}>
                  <SelectTrigger className="w-10 flex justify-center items-center [&>svg]:hidden bg-gray-100 h-full text-sm p-1 px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(COMPARISON_OPTIONS).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex flex-col">
                          <span>{option.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Star Ratings */}
                <div className="flex ml-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => updateSkillProficiency(skill.name, rating)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={cn(
                          "h-5 w-5",
                          rating <= Math.round(skill.proficiency * 5)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-200 text-gray-200",
                          "transition-colors"
                        )}
                      />
                    </button>
                  ))}
                </div>

                {/* Remove Skill */}
                <div
                  title="remove skill"
                  onClick={() => removeSkill(skill.name)}
                  className="flex justify-center ml-auto items-center cursor-pointer"
                >
                  <X className="h-4 w-4 " />
                </div>
              </div>
            ))}
          </div>
          <Separator className="mt-3" />
          {/* popover footer */}
          <div className="sm:justify-start w-full">
            <div className="flex justify-start gap-x-2 w-full">
              <Button className="h-8" disabled={!(selectedSkills.length > 0)} onClick={handleSearchClick}>
                <Search className="w-4 h-4" />
                Search
              </Button>
              <Button
                className="h-8"
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsPopoverOpen(false);
                  setSelectedSkills([]);
                  dispatch(setSkillSearch([]));
                }}
              >
                <X className="w-4 h-4" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SkillSearch;
