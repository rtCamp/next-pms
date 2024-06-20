import json
import re

import frappe

no_cache = 1

SCRIPT_TAG_PATTERN = re.compile(r"\<script[^<]*\</script\>")
CLOSING_SCRIPT_TAG_PATTERN = re.compile(r"</script\>")


def get_context(context):
    csrf_token = frappe.sessions.get_csrf_token()
    frappe.db.commit()
    if frappe.session.user == "Guest":
        boot = frappe.website.utils.get_boot_data()
    else:
        try:
            boot = frappe.sessions.get()
        except Exception as e:
            raise frappe.SessionBootFailed from e
    boot["push_relay_server_url"] = frappe.conf.get("push_relay_server_url")

    # add server_script_enabled in boot
    if "server_script_enabled" in frappe.conf:
        enabled = frappe.conf.server_script_enabled
    else:
        enabled = True
    boot["server_script_enabled"] = enabled

    projects = []
    departments = []
    if "Projects Manager" in frappe.get_roles():
        projects = frappe.get_list("Project", fields=["name", "project_name"])
        departments = frappe.get_all(
            "Department",
            fields=["name", "department_name"],
            filters={"is_group": False},
        )
    boot["projects"] = projects
    boot["departments"] = departments

    boot_json = frappe.as_json(boot, indent=None, separators=(",", ":"))
    boot_json = SCRIPT_TAG_PATTERN.sub("", boot_json)

    boot_json = CLOSING_SCRIPT_TAG_PATTERN.sub("", boot_json)
    boot_json = json.dumps(boot_json)

    context.update(
        {
            "build_version": frappe.utils.get_build_version(),
            "boot": boot_json,
            "csrf_token": csrf_token,
        }
    )

    app_name = frappe.get_website_settings("app_name") or frappe.get_system_settings(
        "app_name"
    )

    if app_name and app_name != "Frappe":
        context["app_name"] = app_name + " | " + "Timesheet"

    else:
        context["app_name"] = "Timesheet"

    return context
