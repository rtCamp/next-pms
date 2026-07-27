/**
 * External dependencies.
 */
import { type PropsWithChildren } from "react";
import { Dropdown, type DropdownOptions } from "@rtcamp/frappe-ui-react";
import {
  AddSm,
  Delete,
  DotHorizontal,
  Duplicate,
  Edit,
  Lock,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { ViewsContextProps } from "@/providers/views";
import type { View } from "@/types";

type ViewsDropdownProps = PropsWithChildren<{
  defaultViews: ViewsContextProps["state"]["defaultViews"];
  savedViews: ViewsContextProps["state"]["savedViews"];
  activeView: ViewsContextProps["state"]["activeView"];
  applyView: ViewsContextProps["actions"]["applyView"];
  deleteView: ViewsContextProps["actions"]["deleteView"];
  createView: () => void;
}>;

export function renderViewIcon(icon: View["icon"], className: string) {
  if (!icon || typeof icon === "string") {
    return icon;
  }
  const Icon = icon;
  return <Icon className={className} />;
}

function ViewsDropdown({
  defaultViews,
  savedViews,
  activeView,
  applyView,
  deleteView,
  createView,
  children,
}: ViewsDropdownProps) {
  const toViewItem = (view: View) => ({
    label: view.label,
    key: String(view.name),
    icon: renderViewIcon(view.icon, "size-4 mr-2"),
    onClick: () => applyView(view),
  });

  const savedViewNames = new Set(savedViews.map((view) => String(view.name)));

  const viewOptions: DropdownOptions = [
    {
      group: "",
      key: "static-views-group",
      items: defaultViews.map(toViewItem),
    },
    ...(savedViews.length > 0
      ? [
          {
            group: "Saved Views",
            key: "saved-views-group",
            items: savedViews.map(toViewItem),
          },
        ]
      : []),
    {
      group: "",
      key: "actions-group",
      items: [
        {
          label: "Create View",
          key: "create-view",
          icon: <AddSm className="size-4 mr-2" />,
          onClick: createView,
        },
      ],
    },
  ];

  return (
    <Dropdown
      options={viewOptions}
      dropdownClassName="w-[220px] px-1"
      groupClassName="px-0 py-1 space-y-1"
      itemClassName="text-ink-gray-8 hover:text-ink-gray-7"
      selectedKey={activeView ? String(activeView.name) : undefined}
      renderMenuItem={(menuProps, state) => {
        const key = state.item.key;
        if (!key || !savedViewNames.has(String(key))) {
          return <div {...menuProps} />;
        }
        const savedViewActions: DropdownOptions = [
          {
            group: "",
            key: "saved-view-actions",
            items: [
              {
                label: "Duplicate",
                icon: <Duplicate className="size-4 mr-2" />,
              },
              { label: "Edit", icon: <Edit className="size-4 mr-2" /> },
              { label: "Make Public", icon: <Lock className="size-4 mr-2" /> },
            ],
          },
          {
            group: "",
            key: "saved-view-danger-actions",
            items: [
              {
                label: "Delete",
                icon: <Delete className="size-4 mr-2" />,
                theme: "red",
                onClick: () => deleteView(String(key)),
              },
            ],
          },
        ];

        return (
          <div {...menuProps}>
            {menuProps.children}
            <div
              className="ml-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <Dropdown options={savedViewActions} side="right">
                <button
                  type="button"
                  className="flex rounded p-0.5 hover:bg-surface-gray-4"
                >
                  <DotHorizontal className="size-4" />
                </button>
              </Dropdown>
            </div>
          </div>
        );
      }}
    >
      {children}
    </Dropdown>
  );
}

export default ViewsDropdown;
