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
  className?: string;
};
const Spinner = ({ isFull = false, className }: SpinnerProp) => {
  return (
    <div
      className={mergeClassNames(
        "flex justify-center items-center",
        isFull && "h-screen",
        className,
      )}
    >
      <LoaderCircle size={64} className="w-6 h-6 animate-spin" />
    </div>
  );
};
export default Spinner;
