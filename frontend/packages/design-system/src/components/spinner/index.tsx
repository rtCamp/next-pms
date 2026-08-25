/**
 * External dependencies
 */
import { LoaderCircle } from "lucide-react";
/**
 * Internal dependencies
 */
import { mergeClassNames } from "../../utils";

export type SpinnerProp = {
  isFull?: boolean;
  size?: number;
  className?: string;
};
const Spinner = ({ isFull = false, size = 24, className }: SpinnerProp) => {
  return (
    <div
      className={mergeClassNames(
        "flex justify-center items-center",
        isFull && "h-screen",
        className,
      )}
    >
      <LoaderCircle size={size} className="animate-spin" />
    </div>
  );
};
export default Spinner;
