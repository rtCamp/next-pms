/**
 * External dependencies.
 */
import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Button, Tooltip } from "@rtcamp/frappe-ui-react";
import { AddSm, Tasks } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { LinkedTodos } from "../../../to-do/linkedTodos";
import { useTodos } from "../../../to-do/provider/context";
import { useLinkableRecords } from "../../../to-do/useLinkableRecords";
import { useLinkedTodos } from "../../../to-do/useLinkedTodos";
import { formatTodoCount } from "../../../to-do/utils";
import type { ProjectTimelineItem } from "../../types";
import { toLinkedRecord } from "../../utils";

export function TodosCell({ item }: { item: ProjectTimelineItem }) {
  const openCreate = useTodos((c) => c.actions.openCreate);
  const isDialogOpen = useTodos((c) => c.state.isDialogOpen);
  const [open, setOpen] = useState(false);
  const record = toLinkedRecord(item);
  const { todos } = useLinkedTodos(record);
  const { canLink } = useLinkableRecords();
  const canEdit = canLink(record);

  if (open && isDialogOpen) setOpen(false);

  if (!todos.length) {
    return canEdit ? (
      <Tooltip text="Add ToDo">
        <Button
          variant="ghost"
          icon={AddSm}
          aria-label={`Add ToDo to ${item.title}`}
          onClick={() => openCreate(record)}
        />
      </Tooltip>
    ) : (
      <span className="text-ink-gray-4">—</span>
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        openOnHover
        delay={200}
        closeDelay={150}
        render={
          <Button
            variant="ghost"
            size="sm"
            iconLeft={Tasks}
            label={String(todos.length)}
            aria-label={`${formatTodoCount(todos.length)} linked`}
          />
        }
      />
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={4}>
          <Popover.Popup className="z-50 outline-none">
            <div className="flex max-h-96 w-96 flex-col rounded-xl bg-surface-modal p-3 shadow-2xl animate-fade-in">
              <LinkedTodos
                record={record}
                canEdit={canEdit}
                title={
                  <span className="truncate text-sm font-medium text-ink-gray-7">
                    ToDos · {item.title}
                  </span>
                }
                emptyMessage="No ToDos linked."
              />
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
