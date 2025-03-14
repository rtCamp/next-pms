/**
 * Internal dependencies.
 */
import { mergeClassNames } from "../../utils";

const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={mergeClassNames("animate-pulse rounded-md bg-slate-200", className)} {...props} />;
};

export default Skeleton;
