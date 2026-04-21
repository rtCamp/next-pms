/**
 * External dependencies.
 */
import { useLocation, useNavigate } from "react-router-dom";
import { Breadcrumbs } from "@rtcamp/frappe-ui-react";
import { Folder, People, Time } from "@rtcamp/frappe-ui-react/icons";
import { ChevronDown } from "lucide-react";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { useUser } from "@/providers/user";

export const TimesheetBreadcrumbs = () => {
  const navigate = useNavigate();
  const hasRoleAccess = useUser(({ state }) => state.hasRoleAccess);
  const { pathname } = useLocation();

  const timesheetViews = [
    {
      key: "personal",
      label: "Personal",
      to: ROUTES["timesheet-personal"],
      icon: Time,
    },
    {
      key: "team",
      label: "Team",
      to: ROUTES["timesheet-team"],
      icon: People,
    },
    {
      key: "project",
      label: "Project",
      to: ROUTES["timesheet-project"],
      icon: Folder,
    },
  ] as const;

  const selectedKey = pathname.includes("team")
    ? "team"
    : pathname.includes("project")
      ? "project"
      : "personal";

  const activeView = timesheetViews.find((v) => v.key === selectedKey)!;

  return (
    <Breadcrumbs
      items={[
        {
          id: "timesheets",
          label: "Timesheets",
        },
        {
          label: activeView.label,
          interactive: hasRoleAccess,
          prefixIcon: <activeView.icon className="size-4" />,
          suffixIcon: hasRoleAccess ? (
            <ChevronDown className="w-4 h-4" />
          ) : undefined,
          dropdown: hasRoleAccess
            ? {
                dropdownClassName: "w-[220px] px-1",
                groupClassName: "px-0 py-1 space-y-1",
                itemClassName: "text-ink-gray-8 hover:text-ink-gray-7",
                selectedKey: selectedKey,
                selectedGroupKey: "views-group",
                options: [
                  {
                    group: "",
                    key: "views-group",
                    items: timesheetViews.map((v) => ({
                      label: v.label,
                      key: v.key,
                      icon: <v.icon className="mr-2 size-4" />,
                      onClick: () => navigate(v.to),
                    })),
                  },
                ],
              }
            : undefined,
        },
      ]}
    />
  );
};
