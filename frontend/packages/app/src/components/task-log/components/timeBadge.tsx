/**
 * External dependencies.
 */
import React from "react";
import { floatToTime } from "@next-pms/design-system";
import { Avatar, Badge } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { TaskWorker } from "../types";

type TimeBadgeProps = {
  hours: number;
  employee?: TaskWorker;
  showAvatar?: boolean;
};

const TimeBadge: React.FC<TimeBadgeProps> = ({
  hours,
  employee,
  showAvatar = true,
}) => {
  return (
    <Badge variant="subtle" size="md">
      {showAvatar && employee && (
        <Avatar
          label={employee.employeeName}
          image={employee.image || undefined}
          size="xs"
        />
      )}
      {floatToTime(hours, 2)}
    </Badge>
  );
};

export default TimeBadge;
