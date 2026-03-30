/**
 * External dependencies.
 */
import { Typography } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { ROLES } from "@/lib/constant";
import { useUser } from "@/providers/user";
import { TeamTimesheetProvider } from "./provider";
import { TeamTimesheetTable } from "./teamTimesheetTable";

function TeamTimesheet() {
  const roles = useUser(({ state }) => state.roles);
  const canAccessTeamTimesheet = roles.some((role) => ROLES.includes(role));

  if (!canAccessTeamTimesheet) {
    return (
      <Typography className="flex items-center justify-center h-full">
        You do not have permission to view Team Timesheets.
      </Typography>
    );
  }

  return (
    <TeamTimesheetProvider>
      <TeamTimesheetTable />
    </TeamTimesheetProvider>
  );
}

export default TeamTimesheet;
