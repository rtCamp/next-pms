/** An app the user can switch to, as `frappe.apps.get_apps` returns it. */
export interface AppLink {
  name: string;
  title: string;
  logo: string;
  route: string;
}

/** `get_apps` leaves out Frappe itself, so Desk is added first. */
export const DESK_APP: AppLink = {
  name: "frappe",
  title: "Desk",
  logo: "/assets/frappe/images/frappe-framework-logo.svg",
  route: "/desk",
};

/** Desk, then every other app except this one. */
export function switchableApps(apps: readonly AppLink[]): AppLink[] {
  return [DESK_APP, ...apps.filter((app) => app.name !== "next_pms")];
}
