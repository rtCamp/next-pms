import type { SystemSettings } from "./systemSettings";

export const PMS_SETTINGS = {
  auto_expand_weeks_by_default: 2,
  use_system_auto_expand_weeks: 0,
  system_auto_expand_weeks_by_default: 1,
};

export const SYSTEM_SETTINGS: SystemSettings = {
  name: "Timesheet Settings",
  allow_backdated_entries: 1,
  allow_backdated_entries_till_employee: 3,
  allow_backdated_entries_till_manager: 7,
  ignored_role: [{ role: "HR Manager" }],
  allow_future_entries: 0,
  allow_weekend_entries: 1,
  auto_expand_weeks_by_default: 1,
  send_daily_reminder: 1,
  daily_reminder_template: "Daily Timesheet Reminder",
  send_reminder_on_approval_request: 0,
  timesheet_approval_template: "Timesheet Approved",
  timesheet_rejection_template: null,
  send_weekly_approval_reminder: 0,
  day_to_send_reminder: "Monday",
  allowed_departments: [{ department: "Engineering" }],
  send_missing_allocation_reminder: 1,
  remind_on: "Friday",
  allocation_email_template: "Missing Allocation",
  designations: [{ designation: "Software Engineer" }],
  default_currency: "USD",
};

/** Request bodies the stories' fake server received, newest last. */
export const requests: { url: string; body: unknown }[] = [];

/**
 * Answers the Settings dialog's calls without a server, and records the writes.
 * Returns the cleanup that restores `fetch`.
 */
export function fakeSettingsServer() {
  requests.length = 0;
  const original = window.fetch;
  window.fetch = async (input, init) => {
    const url = decodeURIComponent(
      String(input instanceof Request ? input.url : input),
    );
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    if (url.includes("get_pms_settings")) {
      return Response.json({ data: PMS_SETTINGS });
    }
    if (url.includes("update_pms_settings")) {
      requests.push({ url, body });
      return Response.json({ data: null });
    }
    if (url.includes("/api/v2/document/Timesheet Settings")) {
      if (init?.method === "PUT") {
        requests.push({ url, body });
        return Response.json({ data: { ...SYSTEM_SETTINGS, ...body } });
      }
      return Response.json({ data: SYSTEM_SETTINGS });
    }
    if (url.includes("frappe.client.get_list")) {
      return Response.json({ data: [{ name: "Daily Timesheet Reminder" }] });
    }
    return original(input, init);
  };
  return () => {
    window.fetch = original;
  };
}
