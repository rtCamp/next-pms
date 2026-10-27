/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  ErrorFallback,
  GlobalSearch,
  HelpPanel,
  NotificationTray,
} from "@next-pms/design-system/components";
import {
  Button,
  Sidebar as BaseSidebar,
  Tooltip,
  type SidebarSectionType,
} from "@rtcamp/frappe-ui-react";
import {
  Help,
  Notifications,
  People,
  Time,
  SearchAlt,
  Folder,
  Grid,
  LogOut,
  Summary,
} from "@rtcamp/frappe-ui-react/icons";
import {
  ArrowLeftRight,
  Briefcase,
  BarChart2,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
/**
 * Internal dependencies.
 */
import LinkWithPreload from "@/components/linkWithPreload";
import { SettingsModal } from "@/components/settings";
import { ROLE_ACCESS, ROUTES } from "@/lib/constant";
import { hasAnyRole, mergeClassNames as cn } from "@/lib/utils";
import logo from "@/logo.svg";
import { useNotifications } from "@/providers/notifications";
import { useTheme } from "@/providers/theme/hook";
import { useUser } from "@/providers/user";
import {
  GENERAL_TIPS,
  NOTIFICATION_ITEM_TOOLTIP,
  NOTIFICATIONS_HELP,
  tipsForPath,
} from "./help";

const Sidebar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const notifications = useNotifications(({ state }) => state.notifications);
  const isNotificationsOpen = useNotifications(({ state }) => state.isTrayOpen);
  const markAsViewed = useNotifications(({ actions }) => actions.markAsViewed);
  const markAllAsViewed = useNotifications(
    ({ actions }) => actions.markAllAsViewed,
  );
  const openTray = useNotifications(({ actions }) => actions.openTray);
  const closeTray = useNotifications(({ actions }) => actions.closeTray);

  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const {
    isSidebarCollapsed,
    employeeId,
    employeeName,
    roles,
    updateIsSidebarCollapsed,
    logout,
  } = useUser(({ state, actions }) => ({
    isSidebarCollapsed: state.isSidebarCollapsed,
    employeeId: state.employeeId,
    employeeName: state.employeeName,
    roles: state.roles,
    updateIsSidebarCollapsed: actions.updateIsSidebarCollapsed,
    logout: actions.logout,
  }));

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const leadershipDashboard = {
    label: "Leadership",
    icon: BarChart2,
    to: ROUTES["dashboard-leadership"],
    isActive: pathname === ROUTES["dashboard-leadership"],
    render: <LinkWithPreload to={ROUTES["dashboard-leadership"]} />,
  };

  const managerDashbaord = {
    label: "Manager",
    icon: Briefcase,
    to: ROUTES["dashboard-manager"],
    isActive: pathname === ROUTES["dashboard-manager"],
    render: <LinkWithPreload to={ROUTES["dashboard-manager"]} />,
  };

  const dashboardItems: SidebarSectionType["items"] = [];

  if (hasAnyRole(roles, ROLE_ACCESS.leadershipDashboard)) {
    dashboardItems.push(leadershipDashboard);
  }
  if (hasAnyRole(roles, ROLE_ACCESS.managerDashboard)) {
    dashboardItems.push(managerDashbaord);
  }

  const personalTimesheet = {
    label: "Timesheet",
    icon: Time,
    to: ROUTES["timesheet-personal"],
    isActive: pathname === ROUTES["timesheet-personal"],
    render: <LinkWithPreload to={ROUTES["timesheet-personal"]} />,
  };

  const teamTimesheet = {
    label: "Team",
    icon: People,
    to: ROUTES["timesheet-team"],
    isActive: pathname === ROUTES["timesheet-team"],
    render: (
      <LinkWithPreload
        to={`${ROUTES["timesheet-team"]}${employeeId ? `?reportsTo=${encodeURIComponent(employeeId)}` : ""}`}
      />
    ),
  };

  const projectTimesheet = {
    label: "Projects",
    icon: Folder,
    to: ROUTES["timesheet-project"],
    isActive: pathname === ROUTES["timesheet-project"],
    render: <LinkWithPreload to={ROUTES["timesheet-project"]} />,
  };

  const timesheetItems: SidebarSectionType["items"] = [personalTimesheet];

  if (hasAnyRole(roles, ROLE_ACCESS.reviewTimesheets)) {
    timesheetItems[0].label = "Personal";
    timesheetItems.push(teamTimesheet);
    timesheetItems.push(projectTimesheet);
  }

  const projects = {
    label: "Projects",
    icon: Folder,
    to: ROUTES.project,
    isActive: pathname === ROUTES.project,
    render: <LinkWithPreload to={`${ROUTES.project}?status=Open`} />,
  };

  const projectItems: SidebarSectionType["items"] = [];

  if (hasAnyRole(roles, ROLE_ACCESS.projects)) {
    projectItems.push(projects);
  }

  const tasks = {
    label: "Tasks",
    icon: Summary,
    to: ROUTES.task,
    isActive: pathname === ROUTES.task,
    render: <LinkWithPreload to={ROUTES.task} />,
  };

  const taskItems: SidebarSectionType["items"] = [tasks];

  const notificationsOption = {
    label: "Notifications",
    icon: Notifications,
    to: "",
    isActive: false,
    onClick: () => openTray(),
  };

  const notificationItems = [];

  const hasNotificationAccess = hasAnyRole(roles, ROLE_ACCESS.notifications);

  if (hasNotificationAccess) {
    notificationItems.push(notificationsOption);
  }

  const teamAllocation = {
    label: "Team",
    icon: People,
    to: ROUTES["allocations-team"],
    isActive: pathname === ROUTES["allocations-team"],
    render: <LinkWithPreload to={ROUTES["allocations-team"]} />,
  };
  const projectAllocation = {
    label: "Projects",
    icon: Folder,
    to: ROUTES["allocations-project"],
    isActive: pathname === ROUTES["allocations-project"],
    render: <LinkWithPreload to={ROUTES["allocations-project"]} />,
  };

  const allocationItems: SidebarSectionType["items"] = [
    teamAllocation,
    projectAllocation,
  ];

  const searchItems = [
    {
      label: "Timesheet - Personal",
      action: () => navigate(ROUTES["timesheet-personal"]),
    },
    {
      label: "Allocations - Team",
      action: () => navigate(ROUTES["allocations-team"]),
    },
    {
      label: "Allocations - project",
      action: () => navigate(ROUTES["allocations-project"]),
    },
    {
      label: "Tasks",
      action: () => navigate(ROUTES["task"]),
    },
  ];

  if (hasAnyRole(roles, ROLE_ACCESS.leadershipDashboard)) {
    searchItems.push({
      label: "Dashboard - Leadership",
      action: () => navigate(ROUTES["dashboard-leadership"]),
    });
  }

  if (hasAnyRole(roles, ROLE_ACCESS.managerDashboard)) {
    searchItems.push({
      label: "Dashboard - Manager",
      action: () => navigate(ROUTES["dashboard-manager"]),
    });
  }

  if (hasAnyRole(roles, ROLE_ACCESS.projects)) {
    searchItems.push({
      label: "Projects",
      action: () => navigate(ROUTES["project"]),
    });
  }

  if (hasAnyRole(roles, ROLE_ACCESS.reviewTimesheets)) {
    searchItems.push({
      label: "Timesheet - Team",
      action: () =>
        navigate(
          employeeId
            ? `${ROUTES["timesheet-team"]}?reportsTo=${encodeURIComponent(employeeId)}`
            : ROUTES["timesheet-team"],
        ),
    });
    searchItems.push({
      label: "Timesheet - Projects",
      action: () => navigate(ROUTES["timesheet-project"]),
    });
  }

  return (
    <ErrorFallback>
      <BaseSidebar
        collapsed={isSidebarCollapsed}
        onCollapseChange={updateIsSidebarCollapsed}
        activeItemClassName="text-ink-gray-8"
        sectionDividers
        header={{
          title: "Next PMS",
          subtitle: employeeName,
          logo,
          menuItems: [
            {
              label: "Apps",
              icon: <Grid size={16} className="text-ink-gray-6 mr-2" />,
              onClick: () => {
                window.location.assign(ROUTES.apps);
              },
            },
            {
              label: "Switch To Desk",
              icon: (
                <ArrowLeftRight size={16} className="text-ink-gray-6 mr-2" />
              ),
              onClick: () => {
                window.location.assign(ROUTES.desk);
              },
            },
            {
              label: "Settings",
              icon: <Settings size={16} className="text-ink-gray-6 mr-2" />,
              onClick: () => setIsSettingsOpen(true),
            },
            {
              label: "Toggle Theme",
              icon:
                theme === "dark" ? (
                  <Sun className="text-ink-gray-6 mr-2" />
                ) : (
                  <Moon className="text-ink-gray-6 mr-2" />
                ),
              onClick: () => setTheme(theme === "dark" ? "light" : "dark"),
            },
            {
              label: "Logout",
              icon: <LogOut size={16} className="text-ink-gray-6 mr-2" />,
              onClick: logout,
            },
          ],
        }}
        sections={[
          {
            label: "",
            items: [
              {
                label: "Search",
                icon: SearchAlt,
                to: "",
                isActive: false,
                onClick: () => setIsSearchOpen(true),
              },
              ...(timesheetItems.length === 1 ? timesheetItems : []),
              ...notificationItems,
              ...projectItems,
              ...taskItems,
              ...(dashboardItems.length === 1 ? dashboardItems : []),
            ],
          },
          ...(dashboardItems.length > 1
            ? [
                {
                  label: "Dashboards",
                  collapsible: true,
                  defaultOpen: dashboardItems.some((item) => item.isActive),
                  items: dashboardItems,
                },
              ]
            : []),
          ...(timesheetItems.length > 1
            ? [
                {
                  label: "Timesheet",
                  collapsible: true,
                  defaultOpen: timesheetItems.some((item) => item.isActive),
                  items: timesheetItems,
                },
              ]
            : []),
          {
            label: "Allocations",
            collapsible: true,
            defaultOpen: allocationItems.some((item) => item.isActive),
            items: allocationItems,
          },
        ]}
      >
        <div slot="footer-items">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start py-1 px-4 text-ink-gray-6",
              isSidebarCollapsed && "px-2",
              isHelpOpen &&
                "bg-surface-selected shadow-sm hover:bg-surface-selected",
            )}
            onClick={() => setIsHelpOpen((prev) => !prev)}
            iconLeft={() => (
              <Tooltip
                text="Help"
                placement="right"
                disabled={!isSidebarCollapsed}
              >
                <Help className="min-w-4 w-4 text-ink-gray-6" />
              </Tooltip>
            )}
          >
            {!isSidebarCollapsed && (
              <span className="flex-1 truncate text-sm">Help</span>
            )}
          </Button>
        </div>
      </BaseSidebar>

      <GlobalSearch
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        items={searchItems}
      />
      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <HelpPanel
        open={isHelpOpen}
        onOpenChange={setIsHelpOpen}
        pageTips={tipsForPath(pathname)}
        generalTips={GENERAL_TIPS}
        roles={roles}
        className={isSidebarCollapsed ? "left-12" : "left-60"}
      />

      {hasNotificationAccess && (
        <NotificationTray
          onOpenChange={(open) => {
            if (!open) closeTray();
          }}
          open={isNotificationsOpen}
          notifications={notifications}
          help={NOTIFICATIONS_HELP}
          itemTooltip={NOTIFICATION_ITEM_TOOLTIP}
          offsetClassName={isSidebarCollapsed ? "left-12" : "left-60"}
          onMarkAllRead={markAllAsViewed}
          onNotificationClick={async (notification) => {
            await markAsViewed(notification.id);
            if (notification.href) {
              window.location.assign(notification.href);
            }
          }}
        />
      )}
    </ErrorFallback>
  );
};

export default Sidebar;
