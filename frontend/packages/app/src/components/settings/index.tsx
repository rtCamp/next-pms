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
import { usePMSSettings, usePMSSystemSettings } from "@/hooks/usePMSSettings";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useUser } from "@/providers/user";
import { SETTINGS_SECTIONS } from "./constants";
import { ProfilePage } from "./pages/profile";
import { SystemResourceManagementPage } from "./pages/system-resource-management";
import { SystemTimesheetsPage } from "./pages/system-timesheets";
import { TimesheetsPage } from "./pages/timesheets";
import type {
  FieldUpdater,
  SettingsModalProps,
  SettingsPage,
  SystemSettings,
} from "./types";

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const toast = useToasts();
  const [activePage, setActivePage] = useState<SettingsPage>("profile");
  const [autoExpandWeeks, setAutoExpandWeeks] = useState("");
  const [useSystemAutoExpandWeeks, setUseSystemAutoExpandWeeks] =
    useState(true);
  const [systemForm, setSystemForm] = useState<SystemSettings>({ name: "" });
  const { employeeName, userName, userId, image, roles } = useUser(
    ({ state }) => ({
      employeeName: state.employeeName,
      userName: state.userName,
      userId: state.userId,
      image: state.image,
      roles: state.roles,
    }),
  );
  const isSystemManager = roles.includes("System Manager");

  const {
    error: settingsError,
    isLoading,
    isSaving,
    mutate,
    pmsSettings,
    updatePMSSettings,
  } = usePMSSettings(open);
  const {
    error: systemError,
    isLoading: isSystemLoading,
    isSaving: isSystemSaving,
    mutate: mutateSystem,
    systemSettings,
    updateSystemSettings,
  } = usePMSSystemSettings(open && isSystemManager);

  const sections = isSystemManager
    ? SETTINGS_SECTIONS
    : SETTINGS_SECTIONS.filter(({ tabs }) =>
        tabs.some(({ id }) => !id.startsWith("system-")),
      );
  const activeTab = sections
    .flatMap(({ tabs }) => tabs)
    .find(({ id }) => id === activePage);
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
    if (systemSettings) {
      const { pm_report_api_key, ...form } = systemSettings;
      void pm_report_api_key;
      setSystemForm(form);
    }
  }, [systemSettings]);

  useEffect(() => {
    const error = settingsError ?? systemError;
    if (error) {
      toast.error(parseFrappeErrorMsg(error));
    }
  }, [settingsError, systemError, toast]);

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

  const saveSystemSettings = async () => {
    try {
      await updateSystemSettings(systemForm);
      await mutateSystem();
      toast.success("Settings saved");
    } catch (error) {
      toast.error(parseFrappeErrorMsg(error as FrappeError));
    }
  };

  const updateSystemField: FieldUpdater<SystemSettings> = (field, value) => {
    setSystemForm((previous) => ({ ...previous, [field]: value }));
  };

  const isSystemTab = activeTab?.id.startsWith("system-") ?? false;
  const isSaveDisabled = isSystemTab
    ? isSystemLoading || isSystemSaving || Boolean(systemError)
    : isLoading || isSaving || Boolean(settingsError);

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
          {sections.map(({ label, tabs }) => (
            <div key={label} className="flex flex-col">
              <p className="flex h-7 items-center px-2 text-base text-ink-gray-5">
                {label}
              </p>
              <nav className="flex flex-col gap-0.5" aria-label={label}>
                {tabs.map(({ id, label: tabLabel, icon: Icon }) => (
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
                    {tabLabel}
                  </button>
                ))}
              </nav>
            </div>
          ))}
        </aside>

        <main className="flex flex-1 flex-col overflow-y-auto bg-surface-modal">
          <div className="px-[4.4rem] pt-10 pb-16">
            {isLoading ||
            (activeTab?.id.startsWith("system-") && isSystemLoading) ? (
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
            ) : activePage === "system-timesheets" ? (
              <SystemTimesheetsPage
                form={systemForm}
                updateField={updateSystemField}
              />
            ) : activePage === "system-resource-management" ? (
              <SystemResourceManagementPage
                form={systemForm}
                updateField={updateSystemField}
              />
            ) : null}
          </div>
          {activeTab?.showSave && (
            <div className="mt-auto flex justify-end border-t border-outline-gray-1 px-8 py-5">
              <Button
                variant="solid"
                label="Save"
                loading={isSaving || isSystemSaving}
                disabled={isSaveDisabled}
                onClick={
                  activeTab.id.startsWith("system-")
                    ? saveSystemSettings
                    : saveSettings
                }
              />
            </div>
          )}
        </main>
      </div>
    </Dialog>
  );
}
