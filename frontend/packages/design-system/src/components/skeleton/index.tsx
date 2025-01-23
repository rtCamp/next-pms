/**
 * Internal dependencies.
 */
import { cn } from "../../utils";

const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("animate-pulse rounded-md bg-slate-900", className)} {...props} />;
};

export default Skeleton;
