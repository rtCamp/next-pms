/**
 * External dependencies.
 */
import { Fragment } from "react";
import { Button, Dialog } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { AddWidgetModalProps } from "./types";
import { CUSTOMIZABLE_WIDGETS } from "../../constants";

export function AddWidgetModal({
  open,
  onOpenChange,
  hidden,
  onAdd,
  onRemove,
}: AddWidgetModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      options={{ title: "Add widgets" }}
      className="my-0"
      classNames={{
        header: "mb-5",
        content: "pt-5 pb-6",
        viewport: "justify-start pt-30",
      }}
    >
      <div className="rounded-lg border border-outline-gray-2 px-2.5 py-2">
        <ul className="flex flex-col gap-2">
          {CUSTOMIZABLE_WIDGETS.map(({ key, label }, index) => {
            const isHidden = hidden.includes(key);

            return (
              <Fragment key={key}>
                {index > 0 && (
                  <li aria-hidden className="h-px w-full bg-outline-gray-1" />
                )}
                <li className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-base font-medium text-ink-gray-7">
                    {label}
                  </span>
                  {isHidden ? (
                    <Button
                      variant="subtle"
                      theme="gray"
                      label="Add"
                      onClick={() => onAdd(key)}
                    />
                  ) : (
                    <Button
                      variant="subtle"
                      theme="red"
                      label="Remove"
                      onClick={() => onRemove(key)}
                    />
                  )}
                </li>
              </Fragment>
            );
          })}
        </ul>
      </div>
    </Dialog>
  );
}
