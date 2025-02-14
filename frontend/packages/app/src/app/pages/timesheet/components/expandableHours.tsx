/**
 * External dependencies
 */
import { useState } from "react";
import { Typography, Separator } from "@next-pms/design-system/components";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

interface ExpandableHoursProps {
  totalHours: string;
  workingHours: string;
  timeoffHours: string;
}
const ExpandableHours = ({ totalHours, workingHours, timeoffHours }: ExpandableHoursProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <>
      <div
        title={isExpanded ? "collapse" : "expand"}
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="flex gap-x-2 max-md:gap-x-3 items-center shrink-0"
      >
        <span className="flex items-center gap-2 shrink-0">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <Typography className="text-sm  hover:underline font-medium">{totalHours}h</Typography>
        </span>
        {isExpanded ? <ChevronLeft className="" /> : <ChevronRight className="" />}
        {isExpanded && (
          <>
            <span className="flex items-center text-sm shrink-0">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <Typography className="text-sm  font-medium">{workingHours}h</Typography>
                <span className="text-muted-foreground text-xs">Work</span>
              </span>
            </span>
            <Separator orientation="vertical" className="block h-3 shrink-0" />
            <span className="flex items-center text-sm shrink-0">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-warning" />
                <Typography className="text-sm  font-medium">{timeoffHours}h</Typography>
                <span className="text-muted-foreground text-xs">Time Off</span>
              </span>
            </span>
          </>
        )}
      </div>
    </>
  );
};

export default ExpandableHours;
