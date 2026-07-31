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
  duplicateView: ViewsContextProps["actions"]["duplicateView"];
  editView: ViewsContextProps["actions"]["editView"];
  updateView: ViewsContextProps["actions"]["updateView"];
  deleteView: ViewsContextProps["actions"]["deleteView"];
  createView: () => void;
}>;

export function renderViewIcon(icon: View["icon"], className: string) {
  if (!icon) {
    return icon;
  }
  if (typeof icon === "string") {
    return <span className={className}>{icon}</span>;
  }
  const Icon = icon;
  return <Icon className={className} />;
}

function ViewsDropdown({
  defaultViews,
  savedViews,
  activeView,
  applyView,
  duplicateView,
  editView,
  updateView,
  deleteView,
  createView,
  children,
}: ViewsDropdownProps) {
  const toViewItem = (view: View) => ({
    label: view.label,
    key: String(view.name),
    icon: renderViewIcon(view.icon, "size-4 mr-2 shrink-0"),
    onClick: () => applyView(view),
  });

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
      itemClassName="cursor-pointer text-ink-gray-8 hover:text-ink-gray-7"
      selectedKey={activeView ? String(activeView.name) : undefined}
      renderMenuItem={(menuProps, state) => {
        const view = savedViews.find(
          ({ name }) => String(name) === String(state.item.key),
        );
        if (!view) {
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
                onClick: () => duplicateView(view),
              },
              {
                label: "Edit",
                icon: <Edit className="size-4 mr-2" />,
                onClick: () => editView(view),
              },
              {
                label: view.public ? "Make Private" : "Make Public",
                icon: <Lock className="size-4 mr-2" />,
                onClick: () =>
                  updateView({ ...view, public: view.public ? 0 : 1 }),
              },
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
                onClick: () => deleteView(view),
              },
            ],
          },
        ];

        return (
          <div {...menuProps}>
            {menuProps.children}
            <div className="ml-auto">
              <Dropdown
                options={savedViewActions}
                side="right"
                itemClassName="cursor-pointer"
              >
                <button
                  type="button"
                  className="flex cursor-pointer rounded p-0.5 hover:bg-surface-gray-4"
                  onClick={(event) => event.stopPropagation()}
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
