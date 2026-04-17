/**
 * External dependencies.
 */
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Breadcrumbs, Button } from "@rtcamp/frappe-ui-react";
import { People } from "@rtcamp/frappe-ui-react/icons";
import { ChevronDown, Folder, Plus } from "lucide-react";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { ROUTES } from "@/lib/constant";
import AddAllocationModal from "./team/add-allocation";

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

function AllocationLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isAddAllocationOpen, setIsAddAllocationOpen] = useState(false);

  const selectedKey = pathname.includes("team") ? "team" : "project";

  const activeView = ALLOCATIONS_VIEWS.find((v) => v.key === selectedKey)!;

  return (
    <>
      <Header className="justify-between px-5">
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
                      icon: <v.icon className="size-4 mr-2" />,
                      onClick: () => navigate(v.to),
                    })),
                  },
                ],
              },
            },
          ]}
        />
        <Button
          variant="solid"
          onClick={() => setIsAddAllocationOpen(true)}
          label="Add allocation"
          iconLeft={() => <Plus />}
        />
      </Header>
      <Outlet />
      <AddAllocationModal
        open={isAddAllocationOpen}
        onOpenChange={setIsAddAllocationOpen}
      />
    </>
  );
}

export default AllocationLayout;
