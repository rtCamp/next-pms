import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Spinner = ({ isFull = false }: { isFull?: boolean }) => {
  return (
    <div className={cn("flex justify-center items-center animate-spin",isFull && "h-screen")}>
      <LoaderCircle size={64} className="w-6 h-6" />
    </div>
  );
};
