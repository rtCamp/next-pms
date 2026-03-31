/**
 * External dependencies.
 */
import { TaskProgress } from "@next-pms/design-system/components";
import {
  mergeClassNames as cn,
  floatToTime,
} from "@next-pms/design-system/utils";

type ProgressProps = {
  actualHours: number;
  estimatedHours?: number;
};

const Progress: React.FC<ProgressProps> = ({
  actualHours,
  estimatedHours = 0,
}) => {
  // Calculate progress percentage
  const progress =
    estimatedHours === 0 ? 0 : Math.round((actualHours / estimatedHours) * 100);

  return (
    <>
      <div className="flex justify-between mt-4 text-base">
        <div className="flex gap-0.75 mb-0.5">
          <div className="flex gap-1">
            <span
              className={cn("font-medium", {
                "text-surface-red-7": progress > 100,
              })}
            >
              {floatToTime(actualHours, 2)}
            </span>
            <span className="text-ink-gray-5">Actual</span>
          </div>
          <span className="text-ink-gray-5">/</span>
          <div className="flex gap-1">
            <span>{floatToTime(estimatedHours, 2)}</span>
            <span className="text-ink-gray-5">Est.</span>
          </div>
        </div>

        <div className="text-ink-gray-6">{progress}%</div>
      </div>

      <TaskProgress value={progress} className="mt-2.5 h-2" />
    </>
  );
};

export default Progress;
