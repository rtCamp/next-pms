/**
 * External dependencies.
 */
import { type PropsWithChildren } from "react";
import { useSearchParams } from "react-router-dom";
import { Spinner } from "@next-pms/design-system/components";
import {
  Breadcrumbs,
  type BreadcrumbRenderDropdown,
} from "@rtcamp/frappe-ui-react";
import { SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import ViewsDropdown, { renderViewIcon } from "@/components/viewsDropdown";
import { Header } from "@/layout/header";
import { useProjectViews } from "../views";

type ProjectsHeaderProps = PropsWithChildren<{
  label: string;
}>;

function ProjectsHeader({ label, children }: ProjectsHeaderProps) {
  const [searchParams] = useSearchParams();
  const defaultViews = useProjectViews((state) => state.state.defaultViews);
  const savedViews = useProjectViews((state) => state.state.savedViews);
  const activeView = useProjectViews((state) => state.state.activeView);
  const isLoading = useProjectViews((state) => state.state.isLoading);
  const createView = useProjectViews((state) => state.actions.createView);
  const applyView = useProjectViews((state) => state.actions.applyView);
  const editView = useProjectViews((state) => state.actions.editView);
  const updateView = useProjectViews((state) => state.actions.updateView);
  const deleteView = useProjectViews((state) => state.actions.deleteView);

  if (isLoading || !activeView) {
    return <Spinner isFull />;
  }

  const renderDropdown: BreadcrumbRenderDropdown = (props) => (
    <ViewsDropdown
      defaultViews={defaultViews}
      savedViews={savedViews}
      activeView={activeView}
      applyView={applyView}
      editView={editView}
      updateView={updateView}
      deleteView={deleteView}
      createView={() =>
        createView({
          type: "List",
          filters: Object.fromEntries(
            [...searchParams.entries()].filter(([key]) => key !== "view"),
          ),
        })
      }
    >
      {props.children}
    </ViewsDropdown>
  );

  return (
    <Header>
      <Breadcrumbs
        items={[
          { id: "Projects", label },
          {
            id: "view",
            label: activeView.label,
            prefixIcon: renderViewIcon(activeView.icon, "size-4"),
            suffixIcon: <SmallDown className="w-4 h-4" />,
            dropdown: { options: [], renderDropdown },
          },
        ]}
      />
      {children}
    </Header>
  );
}

export default ProjectsHeader;
