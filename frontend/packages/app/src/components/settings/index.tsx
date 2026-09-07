/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import { mergeClassNames as cn } from "@next-pms/design-system";
import { Spinner } from "@next-pms/design-system/components";
import { Button, Dialog, useToasts } from "@rtcamp/frappe-ui-react";
import type { FrappeError } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { usePMSSettings } from "@/hooks/usePMSSettings";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useUser } from "@/providers/user";
import { USER_CONFIGURATION_PAGES } from "./constants";
import { ProfilePage } from "./pages/profile";
import { TimesheetsPage } from "./pages/timesheets";
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
  const systemAutoExpandWeeks =
    pmsSettings?.system_auto_expand_weeks_by_default;

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.code === "Comma" &&
        event.shiftKey &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange, open]);

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
      options={{ title: "Settings", size: "4xl" }}
      classNames={{
        content: "p-0!",
        header: "sr-only",
      }}
    >
      <div className="flex h-[min(860px,calc(100vh-8rem))] bg-surface-menu-bar">
        <aside className="flex w-56 shrink-0 flex-col overflow-y-auto border-r border-outline-gray-1 bg-surface-menu-bar p-2">
          <p className="flex h-7 items-center px-2 text-base text-ink-gray-5">
            User Configuration
          </p>
          <nav className="flex flex-col gap-0.5" aria-label="Settings sections">
            {USER_CONFIGURATION_PAGES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActivePage(id)}
                aria-current={activePage === id ? "page" : undefined}
                className={cn(
                  "flex h-7 w-full items-center gap-2 rounded px-2 text-left text-base text-ink-gray-7",
                  activePage === id
                    ? "bg-surface-selected shadow-sm"
                    : "hover:bg-surface-gray-2",
                )}
              >
                <Icon size={16} className="shrink-0 text-ink-gray-6" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex flex-1 flex-col overflow-y-auto bg-surface-modal">
          <div className="px-[4.4rem] pt-10 pb-16">
            {isLoading ? (
              <Spinner isFull />
            ) : activePage === "profile" ? (
              <ProfilePage
                displayName={employeeName || userName || userId}
                email={userId}
                image={image}
              />
            ) : activePage === "timesheets" ? (
              <TimesheetsPage
                autoExpandWeeks={autoExpandWeeks}
                systemAutoExpandWeeks={systemAutoExpandWeeks}
                useSystemAutoExpandWeeks={useSystemAutoExpandWeeks}
                onAutoExpandWeeksChange={setAutoExpandWeeks}
                onUseSystemAutoExpandWeeksChange={setUseSystemAutoExpandWeeks}
              />
            ) : null}
          </div>
          {activePageConfig.showSave && (
            <div className="mt-auto flex justify-end border-t border-outline-gray-1 px-8 py-5">
              <Button
                variant="solid"
                label="Save"
                loading={isSaving}
                disabled={isLoading || isSaving || Boolean(settingsError)}
                onClick={saveSettings}
              />
            </div>
          )}
        </main>
      </div>
    </Dialog>
  );
}
