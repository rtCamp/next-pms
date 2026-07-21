/**
 * External dependencies.
 */
import { useCallback, useEffect, type PropsWithChildren } from "react";
import { useSearchParams } from "react-router-dom";
import { Spinner } from "@next-pms/design-system/components";
import { Breadcrumbs } from "@rtcamp/frappe-ui-react";
import { AddSm, SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { useViews } from "@/providers/views";
import type { View } from "@/types";

const NO_PARAM_KEYS: readonly string[] = [];

type ProjectsHeaderProps = PropsWithChildren<{
  label: string;
  filterParamKeys?: readonly string[];
}>;

function ProjectsHeader({
  label,
  filterParamKeys = NO_PARAM_KEYS,
  children,
}: ProjectsHeaderProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const doctype = useViews((state) => state.state.doctype);
  const views = useViews((state) => state.state.views);
  const createView = useViews((state) => state.actions.createView);
  const isLoading = useViews((state) => state.state.isLoading);
  const viewParam = searchParams.get("view");
  const activeView = views.find(({ name }) => String(name) === viewParam);

  const applyView = useCallback(
    (view: View, options?: { replace?: boolean }) => {
      setSearchParams(
        (params) => {
          for (const key of filterParamKeys) {
            params.delete(key);
          }
          params.set("view", String(view.name));
          if (view.filters && !Array.isArray(view.filters)) {
            for (const [key, value] of Object.entries(view.filters)) {
              params.set(
                key,
                typeof value === "string" ? value : JSON.stringify(value),
              );
            }
          }
          const [sort] = view.order_by ?? [];
          if (typeof sort === "string" && sort) {
            const [field, order] = sort.split(" ");
            params.set("sortField", field);
            params.set("sortOrder", order ?? "desc");
          }
          return params;
        },
        { replace: options?.replace ?? false },
      );
    },
    [setSearchParams, filterParamKeys],
  );

  useEffect(() => {
    if (isLoading || activeView || views.length === 0) {
      return;
    }
    const initialView = views.find((view) => view.default === 1) ?? views[0];
    applyView(initialView, { replace: true });
  }, [isLoading, activeView, views, applyView]);

  if (isLoading || !activeView) {
    return <Spinner isFull />;
  }

  return (
    <Header>
      <Breadcrumbs
        items={[
          { id: doctype, label },
          {
            id: "view",
            label: activeView.label,
            prefixIcon: activeView.icon,
            suffixIcon: <SmallDown className="w-4 h-4" />,
            dropdown: {
              dropdownClassName: "w-[220px] px-1",
              groupClassName: "px-0 py-1 space-y-1",
              itemClassName: "text-ink-gray-8 hover:text-ink-gray-7",
              selectedKey: String(activeView.name),
              selectedGroupKey: "views-group",
              options: [
                {
                  group: "",
                  key: "views-group",
                  items: [
                    ...views.map((view) => ({
                      label: view.label,
                      key: String(view.name),
                      icon: view.icon,
                      onClick: () => applyView(view),
                    })),
                  ],
                },
                {
                  group: "",
                  key: "actions-group",
                  items: [
                    {
                      label: "Create View",
                      key: "create-view",
                      icon: <AddSm className="size-4 mr-2" />,
                      onClick: () =>
                        createView({
                          type: "List",
                          filters: Object.fromEntries(
                            [...searchParams.entries()].filter(
                              ([key]) => key !== "view",
                            ),
                          ),
                        }),
                    },
                  ],
                },
              ],
            },
          },
        ]}
      />
      {children}
    </Header>
  );
}

export default ProjectsHeader;
