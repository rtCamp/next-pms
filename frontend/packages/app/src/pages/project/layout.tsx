/**
 * External dependencies.
 */
import { useSearchParams } from "react-router-dom";
import { Breadcrumbs, Button } from "@rtcamp/frappe-ui-react";
import { ChevronDown, Kanban, AlignLeft, Plus } from "lucide-react";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import ProjectKanban from "./kanban";
import ProjectList from "./list";

const VIEWS = [
  { key: "list", label: "List view", icon: AlignLeft },
  { key: "kanban", label: "Kanban view", icon: Kanban },
] as const;

type ViewKey = (typeof VIEWS)[number]["key"];

function ProjectsLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view: ViewKey =
    searchParams.get("view") === "kanban" ? "kanban" : "list";
  const activeView = VIEWS.find((v) => v.key === view) ?? VIEWS[0];

  return (
    <>
      <Header>
        <Breadcrumbs
          items={[
            { id: "projects", label: "Projects" },
            {
              id: "view",
              label: activeView.label,
              prefixIcon: <activeView.icon className="size-4" />,
              suffixIcon: <ChevronDown className="w-4 h-4" />,
              dropdown: {
                dropdownClassName: "w-[220px] px-1",
                groupClassName: "px-0 py-1 space-y-1",
                itemClassName: "text-ink-gray-8 hover:text-ink-gray-7",
                selectedKey: view,
                selectedGroupKey: "views-group",
                options: [
                  {
                    group: "",
                    key: "views-group",
                    items: VIEWS.map((v) => ({
                      label: v.label,
                      key: v.key,
                      icon: <v.icon className="size-4 mr-2" />,
                      onClick: () =>
                        setSearchParams((prev) => {
                          if (v.key === "list") prev.delete("view");
                          else prev.set("view", v.key);
                          return prev;
                        }),
                    })),
                  },
                ],
              },
            },
          ]}
        />
        <Button
          variant="solid"
          label="Add project"
          iconLeft={() => <Plus />}
          onClick={() => {}}
        />
      </Header>
      {view === "kanban" ? <ProjectKanban /> : <ProjectList />}
    </>
  );
}

export default ProjectsLayout;
