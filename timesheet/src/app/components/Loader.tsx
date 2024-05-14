import { cn } from "@/app/lib/utils";
import { Loader } from "lucide-react";

interface LoaderProps {
  wrapperClassName?: string;
  className?: string;
  isFullPage?: Boolean;
}
export const ScreenLoader = ({
  wrapperClassName = "",
  className = "",
  isFullPage = false,
}: LoaderProps) => {
  return (
    <div
      className={cn(
        `${isFullPage ? "h-screen" : ""}  flex items-center justify-center`,
        wrapperClassName
      )}
    >
      <Loader className={cn("animate-spin", className)} />
    </div>
  );
};
