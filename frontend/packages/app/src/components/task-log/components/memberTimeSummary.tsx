/**
 * External dependencies.
 */
import { floatToTime } from "@next-pms/design-system";
import { Avatar } from "@rtcamp/frappe-ui-react";

type MemberTimeSummaryProps = {
  name: string;
  image: string | null;
  totalHours: number;
};

const MemberTimeSummary: React.FC<MemberTimeSummaryProps> = ({
  name,
  image,
  totalHours,
}) => {
  return (
    <div className="flex justify-between items-center rounded bg-surface-gray-2 px-2 py-1.5 gap-1">
      <Avatar size="xs" label={name || ""} image={image || ""} />
      <span className="text-base">{floatToTime(totalHours || 0, 2)}</span>
    </div>
  );
};

export default MemberTimeSummary;
