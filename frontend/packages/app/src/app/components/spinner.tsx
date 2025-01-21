import { forwardRef } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Spinner = forwardRef<HTMLDivElement, { isFull?: boolean; className?: string }>(
  ({ isFull = false, className }, ref) => {
    return (
      <div ref={ref} className={cn("flex justify-center items-center", isFull && "h-screen", className)}>
        <LoaderCircle size={64} className="w-6 h-6 animate-spin" />
      </div>
    );
  }
);

Spinner.displayName = "Spinner";
