/**
 * External dependencies.
 */
import { useMemo, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Button } from "@rtcamp/frappe-ui-react";
import { AddSm, Tasks } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ROLE_ACCESS } from "@/lib/constant";
import { hasAnyRole } from "@/lib/utils";
import { useUser } from "@/providers/user";
import { LinkedTodoList } from "../../../to-do/linkedTodoList";
import { LinkedTodos } from "../../../to-do/linkedTodos";
import type { TodoOwner } from "../../../to-do/types";
import { formatTodoCount } from "../../../to-do/utils";
import { useCalendar } from "../../context";
import type { ProjectTimelineItem } from "../../types";

export function TodosCell({ item }: { item: ProjectTimelineItem }) {
  const mutate = useCalendar((c) => c.actions.mutate);
  const roles = useUser(({ state }) => state.roles);
  const [open, setOpen] = useState(false);
  const canEdit = hasAnyRole(roles, ROLE_ACCESS.manageTimelineItems);
  const count = item.linkedTodos.length;

  const owner = useMemo<TodoOwner>(
    () => ({
      doctype: "Project Timeline Item",
      name: item.id,
      title: item.title,
      type: item.type,
      todos: item.linkedTodos,
      canEdit,
    }),
    [item.id, item.title, item.type, item.linkedTodos, canEdit],
  );

  if (!count && !canEdit) return <span className="text-ink-gray-4">—</span>;

  return (
    <LinkedTodos owner={owner} onOwnerChange={mutate} enabled={open}>
      {({ openCreate, openEdit }) =>
        count ? (
          <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={Tasks}
                  label={String(count)}
                  aria-label={`${formatTodoCount(count)} linked`}
                />
              }
            />
            <Popover.Portal>
              <Popover.Positioner side="bottom" align="start" sideOffset={4}>
                <Popover.Popup className="z-50 outline-none">
                  <div className="w-96 rounded-xl bg-surface-modal p-3 shadow-2xl animate-fade-in">
                    <LinkedTodoList
                      title={
                        <span className="truncate text-sm font-medium text-ink-gray-7">
                          ToDos · {item.title}
                        </span>
                      }
                      emptyMessage="No ToDos linked."
                      onAdd={() => {
                        setOpen(false);
                        openCreate();
                      }}
                      onEdit={(todo) => {
                        setOpen(false);
                        openEdit(todo);
                      }}
                    />
                  </div>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            iconLeft={AddSm}
            label="Add"
            aria-label={`Add ToDo to ${item.title}`}
            onClick={openCreate}
          />
        )
      }
    </LinkedTodos>
  );
}
