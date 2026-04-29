/**
 * External dependencies.
 */
import { useLocation, useNavigate } from "react-router-dom";
import { Breadcrumbs } from "@rtcamp/frappe-ui-react";
import { Folder, People } from "@rtcamp/frappe-ui-react/icons";
import { ChevronDown } from "lucide-react";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";

export const AllocationsBreadcrumbs = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const ALLOCATIONS_VIEWS = [
    {
      key: "team",
      label: "Team",
      to: ROUTES["allocations-team"],
      icon: People,
    },
    {
      key: "project",
      label: "Project",
      to: ROUTES["allocations-project"],
      icon: Folder,
    },
  ] as const;

  const selectedKey = pathname.includes("project") ? "project" : "team";

  const activeView = ALLOCATIONS_VIEWS.find((v) => v.key === selectedKey)!;

  return (
    <Breadcrumbs
      items={[
        {
          id: "allocations",
          label: "Allocations",
        },
        {
          id: "team",
          label: activeView.label,
          prefixIcon: <activeView.icon className="size-4" />,
          suffixIcon: <ChevronDown className="w-4 h-4" />,
          dropdown: {
            dropdownClassName: "w-[220px] px-1",
            groupClassName: "px-0 py-1 space-y-1",
            itemClassName: "text-ink-gray-8 hover:text-ink-gray-7",
            selectedKey: selectedKey,
            selectedGroupKey: "views-group",
            options: [
              {
                group: "",
                key: "views-group",
                items: ALLOCATIONS_VIEWS.map((v) => ({
                  label: v.label,
                  key: v.key,
                  icon: <v.icon className="mr-2 size-4" />,
                  onClick: () => navigate(v.to),
                })),
              },
            ],
          },
        },
      ]}
    />
  );
};
