/**
 * External dependencies
 */

import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
/**
 * Internal dependencies
 */
import { Typography } from "@/app/components/typography";
import { Separator } from "@/app/components/ui/separator";

interface ExpandableHoursProps {
  totalHours: string;
  workingHours: string;
  timeoffHours: string;
}
const ExpandableHours = ({ totalHours, workingHours, timeoffHours }: ExpandableHoursProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <>
      {/* Total Hours */}
      <div
        title={isExpanded?"collapse":"expand"}
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="flex gap-x-2 max-md:gap-x-3 items-center shrink-0"
      >
        <span className="flex items-center gap-2 shrink-0">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <Typography className="text-sm max-md:text-xs hover:underline font-medium">{totalHours}h</Typography>
        </span>
        {isExpanded ? <ChevronLeft className="" /> : <ChevronRight className="" />}
        {/* Hours Breakdown */}
        {isExpanded && (
          <>
            <span className="flex items-center text-sm shrink-0">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <Typography className="text-sm max-md:text-xs font-medium">{workingHours}h</Typography>
                <span className="text-muted-foreground text-xs">Work</span>
              </span>
            </span>
            <Separator orientation="vertical" className="block h-3 shrink-0" />
            <span className="flex items-center text-sm shrink-0">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-warning" />
                <Typography className="text-sm max-md:text-xs font-medium">{timeoffHours}h</Typography>
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