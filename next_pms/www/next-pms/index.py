import json
import re

import frappe

from next_pms.timesheet.api.app import has_bu_field, has_industry_field
from next_pms.timesheet.api.project import get_project_filter_for_contractor
from next_pms.timesheet.doctype.pms_view_setting.pms_view_setting import get_views

no_cache = 1


def get_context(context):
    csrf_token = frappe.sessions.get_csrf_token()
    # nosemgrep
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
    boot["views"] = get_views()
    boot["currencies"] = frappe.get_all("Currency", pluck="name", filters={"enabled": 1})
    boot["has_business_unit"] = has_bu_field()
    boot["has_industry"] = has_industry_field()
    boot["is_calendar_setup"] = is_google_calendar_enabled()
    boot["global_filters"] = get_global_filters()
    boot_json = frappe.as_json(boot, indent=None, separators=(",", ":"))
    boot_json = re.sub(
        r"<script\b[^>]*>.*?</script\s*>",
        "",
        boot_json,
        flags=re.DOTALL | re.IGNORECASE,
    )

    boot_json = json.dumps(boot_json)

    context.update(
        {
            "build_version": frappe.utils.get_build_version(),
            "boot": boot_json,
            "csrf_token": csrf_token,
        }
    )

    context["app_name"] = "Next PMS"

    return context


@frappe.whitelist(methods=["POST"], allow_guest=True)  # nosemgrep: frappe-semgrep.rules.security.guest-whitelisted-method
def get_context_for_dev():
    if not frappe.conf.developer_mode:
        frappe.throw(frappe._("This method is only meant for developer mode"))
    return json.loads(get_boot())


def get_boot():
    boot = frappe.sessions.get()
    boot["views"] = get_views()
    boot["currencies"] = frappe.get_all("Currency", pluck="name", filters={"enabled": 1})
    boot["has_business_unit"] = has_bu_field()
    boot["has_industry"] = has_industry_field()
    boot["is_calendar_setup"] = is_google_calendar_enabled()
    boot["app_name"] = "Next PMS"
    boot["global_filters"] = get_global_filters()
    boot_json = frappe.as_json(boot, indent=None, separators=(",", ":"))
    boot_json = re.sub(
        r"<script\b[^>]*>.*?</script\s*>",
        "",
        boot_json,
        flags=re.DOTALL | re.IGNORECASE,
    )
    boot_json = json.dumps(boot_json)
    return boot_json


def is_google_calendar_enabled():
    return bool(frappe.db.exists("Google Calendar", {"user": frappe.session.user, "enable": 1}))


def get_global_filters():
    filters = {}
    filters["project"] = get_project_filter_for_contractor()
    return filters
