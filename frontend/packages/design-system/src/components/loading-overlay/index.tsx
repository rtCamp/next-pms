/**
 * External dependencies
 */
import type { PropsWithChildren } from "react";

/**
 * Internal dependencies
 */
import { mergeClassNames } from "../../utils";
import Spinner from "../spinner";

export type LoadingOverlayProps = PropsWithChildren<{
  active: boolean;
  className?: string;
}>;

const LoadingOverlay = ({
  active,
  className,
  children,
}: LoadingOverlayProps) => {
  return (
    <div
      className={mergeClassNames(
        "relative flex min-h-0 flex-1 flex-col",
        className,
      )}
    >
      <div
        className={mergeClassNames(
          "flex min-h-0 flex-1 flex-col",
          active && "opacity-50 transition-opacity duration-150",
        )}
      >
        {children}
      </div>
      {active && (
        <Spinner
          isFull
          className="absolute top-0 left-0 h-full w-full cursor-wait"
        />
      )}
    </div>
  );
};

export default LoadingOverlay;
