/**
 * External dependencies.
 */
import { Typography } from "@next-pms/design-system/components";
import { Button } from "@rtcamp/frappe-ui-react";
/**
 * Internal dependencies.
 */
import { useUser } from "@/providers/user";

export default function Component() {
  const logout = useUser(({ actions }) => actions.logout);
  return (
    <div className="flex items-center min-h-screen px-4 py-12 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      <div className="w-full space-y-6 text-center">
        <div className="space-y-3">
          <Typography
            variant="h1"
            className="text-4xl font-bold tracking-tighter sm:text-5xl"
          >
            Access Restricted
          </Typography>
          <Typography className="text-primary/60 text-base">
            You are not an employee in this company.
          </Typography>
        </div>
        <Button onClick={logout}>Log out</Button>
      </div>
    </div>
  );
}
