/**
 * External dependencies
 */
import { CircleCheck, CircleX, Clock3 } from "lucide-react";

/**
 * Internal dependencies
 */
import Button from "@design-system/components/button";
import { cn } from "@design-system/utils";

type submitButtonProps = {
  start_date: string;
  end_date: string;
  onClick?: (start_date: string, end_date: string) => void;
  status: string;
};
export const SubmitButton = ({ start_date, end_date, onClick, status }: submitButtonProps) => {
  const handleClick = () => {
    onClick && onClick(start_date, end_date);
  };
  return (
    <Button
      variant="ghost"
      asChild
      className={cn(
        "font-normal",
        (status == "Approved" || status == "Partially Approved") && "bg-green-50 text-success",
        (status == "Rejected" || status == "Partially Rejected") && "bg-red-50 text-destructive",
        status == "Approval Pending" && "bg-orange-50 text-warning",
        status == "Not Submitted" && "text-slate-400"
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (status != "Approved") {
          handleClick();
        }
      }}
    >
      <span>
        {(status == "Approved" || status == "Partially Approved") && <CircleCheck className="stroke-success" />}
        {(status == "Rejected" || status == "Partially Rejected") && <CircleX className="stroke-destructive" />}
        {status == "Approval Pending" && <Clock3 className="stroke-warning" />}
        {status == "Not Submitted" && <CircleCheck className="" />}
        {status}
      </span>
    </Button>
  );
};
