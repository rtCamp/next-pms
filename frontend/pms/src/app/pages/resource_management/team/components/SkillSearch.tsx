/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { useFrappeGetDocList } from "frappe-react-sdk";
import { Filter as Funnel, Search, Star, X } from "lucide-react";

/**
 * Internal dependencies.
 */
import { DeBounceInput } from "@/app/components/deBounceInput";
import { Typography } from "@/app/components/typography";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Separator } from "@/app/components/ui/separator";
import { cn } from "@/lib/utils";
import { RootState } from "@/store";
import { setSkillSearch, Skill } from "@/store/resource_management/team";

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
  const [skills, setSkills] = useState<Skill[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>(resourceTeamState?.skillSearch || []);
  const [suggestions, setSuggestions] = useState<Skill[]>([]);
  const { data } = useFrappeGetDocList("Skill", {
    limit: 0,
    asDict: true,
  });

  useEffect(() => {
    if (data) {
      setSkills(data);
    }
  }, [data]);

  // showing skill-suggestions when user types something
  useEffect(() => {
    if (searchQuery) {
      setSuggestions(skills?.filter((skill) => skill.name.toLowerCase().includes(searchQuery.toLowerCase())) || []);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery,skills]);

  const addSkill = (skill: { name: string }) => {
    if (!selectedSkills.find((s) => s.name === skill.name)) {
      setSelectedSkills([
        ...selectedSkills,
        {
          ...skill,
          proficiency: 0.2, //default proficiency is 0.2 stars
          operator: COMPARISON_OPTIONS.greater_than_equals.value,
        },
      ]);
    }
    setSearchQuery("");
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
  }, [resourceTeamState.skillSearch,setSkillSearchParam]);

  return (
    <Popover
      open={isPopoverOpen}
      onOpenChange={(value) => {
        if (!value) {
          // empty selected skills after closing the popover
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
      <PopoverContent align="end" className="w-96">
        <div>
          <h1>Skill Search</h1>
          <p className="text-sm text-muted-foreground">Search and select skills with required proficiency levels.</p>
        </div>

        <div className="space-y-4 pt-4">
          {/* SkillSearch Input */}
          <div className="relative w-full">
            <DeBounceInput
              placeholder="Search skills..."
              value={searchQuery}
              deBounceValue={300}
              callback={(e) => setSearchQuery(e.target.value)}
              className={cn("w-full min-w-full", suggestions.length > 0 && "[&>input]:rounded-b-none")}
            />
            {/* Skill suggestion */}
            {suggestions.length > 0 && (
              <div
                className={cn(
                  "absolute z-10 w-full max-h-[200px] overflow-y-auto rounded-md border bg-background shadow-md",
                  suggestions.length > 0 && "border-t-0 rounded-t-none"
                )}
              >
                {suggestions.map((skill) => (
                  <button
                    key={skill.name}
                    onClick={() => addSkill(skill)}
                    className="w-full px-4 py-2 text-left hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
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
                  className="font-medium bg-gray-100 border h-full rounded-md p-1 px-2 w-24 truncate text-sm"
                  title={skill.name} // Tooltip to show the full name on hover
                >
                  <Typography variant="p" className="truncate max-w-md">
                    {skill.name}
                  </Typography>
                </div>

                {/* Operator Select Menu */}
                <Select value={skill.operator} onValueChange={(value) => updateSkillComparison(skill.name, value)}>
                  <SelectTrigger className="w-14 [&>svg]:hidden bg-gray-100 h-full text-sm p-1 px-2">
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
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => updateSkillProficiency(skill.name, rating)} // Pass the star count directly
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          rating <= Math.round(skill.proficiency * 5) // Compare current star rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-200 text-gray-200"
                        } transition-colors`}
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
