import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Spinner = ({ isFull = false, className }: { isFull?: boolean; className?: string }) => {
  return (
    <div className={cn("flex justify-center items-center", isFull && "h-screen", className)}>
      <LoaderCircle size={64} className="w-6 h-6 animate-spin" />
    </div>
  );
};
