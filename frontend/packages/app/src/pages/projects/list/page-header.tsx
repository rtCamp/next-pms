/**
 * External dependencies.
 */
import { useSearchParams } from "react-router-dom";
import { Breadcrumbs, Button } from "@rtcamp/frappe-ui-react";
import { AddSm, SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { VIEWS } from "../constants";

export function ProjectListPageHeader() {
  const [, setSearchParams] = useSearchParams();
  const activeView = VIEWS.find((v) => v.key === "list") ?? VIEWS[0];

  return (
    <Header>
      <Breadcrumbs
        items={[
          { id: "projects", label: "Projects" },
          {
            id: "view",
            label: activeView.label,
            prefixIcon: <activeView.icon className="size-4" />,
            suffixIcon: <SmallDown className="w-4 h-4" />,
            dropdown: {
              dropdownClassName: "w-[220px] px-1",
              groupClassName: "px-0 py-1 space-y-1",
              itemClassName: "text-ink-gray-8 hover:text-ink-gray-7",
              selectedKey: "list",
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
        iconLeft={() => <AddSm />}
        onClick={() => {}}
      />
    </Header>
  );
}
