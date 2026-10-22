/**
 * External dependencies.
 */
import { Breadcrumbs, Button } from "@rtcamp/frappe-ui-react";
import {
  AddSm,
  AlignLeft,
  Kanban,
  SmallDown,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { canCreate } from "@/lib/utils";
import { GROWTH_DOCTYPE } from "@/pages/project-details/tabs/growth/constants";
import { useGrowth } from "@/pages/project-details/tabs/growth/context";
import { usePipeline } from "./context";

export function PipelineHeader() {
  const view = usePipeline((c) => c.state.view);
  const setView = usePipeline((c) => c.actions.setView);
  const openCreate = useGrowth((c) => c.actions.openCreate);
  const ViewIcon = view === "list" ? AlignLeft : Kanban;

  return (
    <Header>
      <Breadcrumbs
        items={[
          { id: "growth", label: "Growth" },
          {
            id: "view",
            label: view === "list" ? "List" : "Pipeline",
            prefixIcon: <ViewIcon className="size-4" />,
            suffixIcon: <SmallDown className="size-4" />,
            dropdown: {
              options: [
                {
                  label: "Pipeline",
                  icon: <Kanban className="size-4" />,
                  onClick: () => setView("board"),
                },
                {
                  label: "List",
                  icon: <AlignLeft className="size-4" />,
                  onClick: () => setView("list"),
                },
              ],
            },
          },
        ]}
      />
      {canCreate(GROWTH_DOCTYPE) && (
        <Button
          variant="solid"
          label="New growth initiative"
          iconLeft={AddSm}
          onClick={() => openCreate()}
        />
      )}
    </Header>
  );
}
