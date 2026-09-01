/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { mergeClassNames as cn } from "@next-pms/design-system";
import { Button, Dialog, useToasts } from "@rtcamp/frappe-ui-react";
import type { FrappeError } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { usePMSSettings } from "@/hooks/usePMSSettings";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useUser } from "@/providers/user";
import { USER_CONFIGURATION_PAGES } from "./constants";
import type { SettingsModalProps, SettingsPage } from "./types";

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const toast = useToasts();
  const [activePage, setActivePage] = useState<SettingsPage>("profile");
  const [autoExpandWeeks, setAutoExpandWeeks] = useState("");
  const [useSystemAutoExpandWeeks, setUseSystemAutoExpandWeeks] =
    useState(true);
  const { employeeName, userName, userId, image } = useUser(({ state }) => ({
    employeeName: state.employeeName,
    userName: state.userName,
    userId: state.userId,
    image: state.image,
  }));
  const {
    error: settingsError,
    isLoading,
    isSaving,
    mutate,
    pmsSettings,
    updatePMSSettings,
  } = usePMSSettings(open);
  const activePageConfig =
    USER_CONFIGURATION_PAGES.find(({ id }) => id === activePage) ??
    USER_CONFIGURATION_PAGES[0];
  const ActivePage = activePageConfig.component;

  useEffect(() => {
    const value = pmsSettings?.auto_expand_weeks_by_default;
    setAutoExpandWeeks(
      value === null || value === undefined ? "" : String(value),
    );
    setUseSystemAutoExpandWeeks(
      Boolean(pmsSettings?.use_system_auto_expand_weeks),
    );
  }, [pmsSettings]);

  useEffect(() => {
    if (settingsError) {
      toast.error(parseFrappeErrorMsg(settingsError));
    }
  }, [settingsError, toast]);

  const saveSettings = async () => {
    try {
      await updatePMSSettings({
        settings: {
          auto_expand_weeks_by_default:
            autoExpandWeeks === "" ? null : Number(autoExpandWeeks),
          use_system_auto_expand_weeks: useSystemAutoExpandWeeks ? 1 : 0,
        },
      });
      await mutate();
      toast.success("Settings saved");
    } catch (error) {
      toast.error(parseFrappeErrorMsg(error as FrappeError));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      options={{ title: "Settings", size: "5xl" }}
      classNames={{
        content: "p-0!",
        header: "sr-only",
      }}
    >
      <div className="flex h-[calc(100vh-8rem)] bg-surface-menu-bar">
        <aside className="m-1 flex w-56 shrink-0 flex-col overflow-y-auto rounded-l-lg bg-surface-menu-bar">
          <p className="my-0.75 h-7.5 px-2 py-1.75 text-xs font-medium text-ink-gray-5">
            User Configuration
          </p>
          <nav className="space-y-0.75 px-1" aria-label="Settings sections">
            {USER_CONFIGURATION_PAGES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActivePage(id)}
                className={cn(
                  "flex h-7.5 w-full items-center gap-1.5 rounded px-2 py-1.75 text-left text-sm text-ink-gray-8",
                  activePage === id
                    ? "bg-surface-selected shadow-sm hover:bg-surface-selected"
                    : "hover:bg-surface-gray-3",
                )}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex flex-1 flex-col overflow-y-auto bg-surface-modal">
          <div className="p-8">
            <ActivePage
              displayName={employeeName || userName || userId}
              email={userId}
              image={image}
              autoExpandWeeks={autoExpandWeeks}
              useSystemAutoExpandWeeks={useSystemAutoExpandWeeks}
              isLoading={isLoading}
              onAutoExpandWeeksChange={setAutoExpandWeeks}
              onUseSystemAutoExpandWeeksChange={setUseSystemAutoExpandWeeks}
            />
          </div>
          {activePageConfig.showSave && (
            <div className="mt-auto flex justify-end border-t border-outline-gray-1 px-8 py-5">
              <Button
                variant="solid"
                label="Save"
                loading={isSaving}
                disabled={isLoading || isSaving}
                onClick={saveSettings}
              />
            </div>
          )}
        </main>
      </div>
    </Dialog>
  );
}
