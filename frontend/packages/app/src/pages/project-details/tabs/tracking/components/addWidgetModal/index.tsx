/**
 * External dependencies.
 */
import { Fragment, useEffect, useState } from "react";
import { Button, Dialog } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { AddWidgetModalProps } from "./types";
import { CUSTOMIZABLE_WIDGETS } from "../../constants";

export function AddWidgetModal({
  open,
  hidden,
  isSaving,
  onClose,
  onSave,
}: AddWidgetModalProps) {
  const [staged, setStaged] = useState(hidden);

  useEffect(() => {
    if (open) {
      setStaged(hidden);
    }
  }, [open, hidden]);

  const isDirty =
    staged.length !== hidden.length ||
    staged.some((key) => !hidden.includes(key));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
      className="my-0"
      classNames={{
        header: "mb-5",
        content: "pt-5 pb-2",
        viewport: "justify-start pt-30",
        footer: "pb-6",
      }}
      options={{ title: "Add widgets", size: "sm" }}
      actions={
        <div className="flex w-full items-center justify-end gap-2">
          <Button
            variant="ghost"
            label="Cancel"
            onClick={onClose}
            disabled={isSaving}
          />
          <Button
            variant="solid"
            label="Save"
            onClick={() => onSave(staged)}
            disabled={!isDirty || isSaving}
            loading={isSaving}
          />
        </div>
      }
    >
      <div className="rounded-lg border border-outline-gray-2 px-2.5 py-2">
        <ul className="flex flex-col gap-2">
          {CUSTOMIZABLE_WIDGETS.map(({ key, label }, index) => {
            const isHidden = staged.includes(key);

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
                      onClick={() =>
                        setStaged((current) =>
                          current.filter((it) => it !== key),
                        )
                      }
                    />
                  ) : (
                    <Button
                      variant="subtle"
                      theme="red"
                      label="Remove"
                      onClick={() => setStaged((current) => [...current, key])}
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
