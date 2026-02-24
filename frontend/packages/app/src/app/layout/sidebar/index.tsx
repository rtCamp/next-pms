/**
 * External dependencies.
 */
import { Home, LucideUser } from "lucide-react";
import { 
    Sidebar as BaseSidebar, 
    Notifications, 
    Search, 
    Tasks, 
    Folder,
    Time,
    People,
    Batches,
    Layers,
    Reports
} from "@rtcamp/frappe-ui-react";
import { useSelector } from "react-redux";

/**
 * Internal dependencies.
 */
import { RootState } from "@/store";
import logo from "../../../logo.svg";

const Sidebar = () => {
  const user = useSelector((state: RootState) => state.user);

  return (
    <BaseSidebar
      header={{
        logo,
        title: "Frappe PMS",
        subtitle: user.userName,
        menuItems: [
          {
            label: "Logout",
            to: "/logout",
            icon: <LucideUser size={16} className="text-ink-gray-6 mr-2" />,
            onClick: () => alert("Logging out..."),
          },
        ],
      }}
      sections={[
        {
          label: "",
          items: [
            {
              label: "Notifications",
              icon: Notifications,
              to: "",
            },
            {
              label: "Search",
              icon: Search,
              to: "",
            },
          ],
        },
        {
          label: "",
          items: [
            {
              label: "Home",
              icon: Home,
              to: "",
            },
            {
              label: "Tasks",
              icon: Tasks,
              to: "",
            },
            {
              label: "Projects",
              icon: Folder,
              to: "",
            },
          ],
        },
        {
          label: "Timesheet",
          collapsible: true,
          items: [
            {
              label: "Personal",
              icon: Time,
              to: "",
            },
            {
              label: "Team",
              icon: People,
              to: "",
            },
            {
              label: "Projects",
              icon: Folder,
              to: "",
            },
          ],
        },
        {
          label: "",
          items: [
            {
              label: "Allocation",
              icon: Batches,
              to: "",
            },
            {
              label: "Roadmap",
              icon: Layers,
              to: "",
            },
            {
              label: "Reports",
              icon: Reports,
              to: "",
            },
          ],
        },
      ]}
    />
  );
};

export default Sidebar;
