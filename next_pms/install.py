import os

from frappe import _, get_app_path, get_doc, read_file

from next_pms.permissions.docperms import apply_permissions
from next_pms.setup import install, install_custom_fields


def after_install():
    install()
    setup_email_template()
    setup_project_threshold_reminder_template()
    create_default_project_phases()
    create_default_risk_masters()
    create_default_timeline_item_categories()
    create_default_growth_masters()
    create_default_technologies()
    create_default_delivery_accelerators()
    add_tech_stack_to_crm_deal_layout()
    setup_time_report_frequency()
    apply_permissions()


def after_app_install(app_name):
    if app_name in ("crm", "frappe_crm_xt"):
        install_custom_fields()
        add_tech_stack_to_crm_deal_layout()


def add_tech_stack_to_crm_deal_layout():
    import json

    import frappe

    layout_name = "CRM Deal-Data Fields"
    if not frappe.db.exists("DocType", "CRM Fields Layout") or not frappe.db.exists("CRM Fields Layout", layout_name):
        return

    layout = frappe.get_doc("CRM Fields Layout", layout_name)
    tabs = json.loads(layout.layout or "[]")
    columns = [column for tab in tabs for section in tab.get("sections", []) for column in section.get("columns", [])]
    if any("tech_stack" in column.get("fields", []) for column in columns):
        return

    for column in columns:
        fields = column.get("fields", [])
        if "custom_current_host" in fields:
            fields.insert(fields.index("custom_current_host") + 1, "tech_stack")
            layout.layout = json.dumps(tabs)
            layout.save(ignore_permissions=True)
            return


def setup_time_report_frequency():
    import frappe

    for frequency in ("Weekly", "Bi-weekly", "Monthly"):
        if not frappe.db.exists("Project Time Report Frequency", frequency):
            frappe.get_doc({"doctype": "Project Time Report Frequency", "name": frequency}).insert(
                ignore_permissions=True
            )


def setup_email_template():
    base_path = get_app_path("next_pms", "templates", "timesheet")
    response = read_file(os.path.join(base_path, "daily_timesheet_reminder.html"))

    records = [
        {
            "doctype": "Email Template",
            "name": _("Daily Timesheet Reminder"),
            "response": response,
            "subject": _("Daily Timesheet Reminder"),
            "owner": "Administrator",
        }
    ]
    response = read_file(os.path.join(base_path, "approval_reminder.html"))
    records.append(
        {
            "doctype": "Email Template",
            "name": _("Approval Request Reminder"),
            "response": response,
            "subject": _("Approval Request Reminder"),
            "owner": "Administrator",
        }
    )
    response = read_file(os.path.join(base_path, "weekly_approval_reminder.html"))
    records.append(
        {
            "doctype": "Email Template",
            "name": _("Weekly Approval Reminder"),
            "response": response,
            "subject": _("Weekly Approval Reminder"),
            "owner": "Administrator",
            "use_html": 1,
        }
    )
    create_docs(records)


def setup_project_threshold_reminder_template():
    """Create or refresh the project threshold reminder Email Template from the shipped HTML file."""
    import frappe

    from next_pms.project_currency.constant import PROJECT_THRESHOLD_REMINDER_EMAIL_TEMPLATE

    base_path = get_app_path("next_pms", "templates", "project_currency")
    values = {
        "subject": _("Project threshold reached for {{ project.project_name }}"),
        "response_html": read_file(os.path.join(base_path, "project_threshold_reminder.html")),
        "use_html": 1,
    }

    if frappe.db.exists("Email Template", PROJECT_THRESHOLD_REMINDER_EMAIL_TEMPLATE):
        template = get_doc("Email Template", PROJECT_THRESHOLD_REMINDER_EMAIL_TEMPLATE)
        template.update(values)
        template.save(ignore_permissions=True)
        return

    create_docs(
        [
            {
                "doctype": "Email Template",
                "name": PROJECT_THRESHOLD_REMINDER_EMAIL_TEMPLATE,
                "owner": "Administrator",
                **values,
            }
        ]
    )


def create_docs(records: list):
    for doc in records:
        get_doc(doc).insert(ignore_permissions=True, ignore_mandatory=True, ignore_if_duplicate=True)


def create_default_project_phases():
    import frappe

    phases = [
        {"doctype": "Project Phase", "phase": "Delivery Prep", "position": 1, "color": "gray"},
        {"doctype": "Project Phase", "phase": "Kick Off", "position": 2, "color": "blue"},
        {"doctype": "Project Phase", "phase": "Discovery", "position": 3, "color": "orange"},
        {"doctype": "Project Phase", "phase": "Development", "position": 4, "color": "cyan"},
        {"doctype": "Project Phase", "phase": "Launch", "position": 5, "color": "green"},
        {"doctype": "Project Phase", "phase": "Close Out", "position": 6, "color": "purple"},
    ]

    for phase_data in phases:
        if not frappe.db.exists("Project Phase", {"phase": phase_data["phase"]}):
            frappe.get_doc(phase_data).insert(ignore_permissions=True, ignore_mandatory=True)


def create_default_risk_masters():
    risk_categories = ("Internal Team", "Client", "Design", "Technical", "Timeline/Budget")
    risk_levels = ("Low", "Medium", "High")
    risk_statuses = ("To-do", "In Progress", "Escalated", "Blocked", "Mitigated")

    for doctype, names in (
        ("Risk Category", risk_categories),
        ("Risk Level", risk_levels),
        ("Risk Status", risk_statuses),
    ):
        _insert_masters(doctype, [{"name": name} for name in names])


def create_default_technologies():
    technologies = ("WordPress VIP", "Drupal", "AEM", "Next.js", "Frappe")
    _insert_masters("Technology", [{"name": name, "technology_name": name} for name in technologies])


def create_default_delivery_accelerators():
    accelerators = ("Figma-to-FSE pipeline", "FE pipeline", "Garuda", "Training Videos")
    _insert_masters("Delivery Accelerator", [{"name": name, "accelerator_name": name} for name in accelerators])


def create_default_timeline_item_categories():
    import frappe

    categories = (
        {"category_name": "Contract", "applies_to": "Milestone", "position": 1},
        {"category_name": "Delivery", "applies_to": "Milestone", "position": 2},
        {"category_name": "Client-Requested", "applies_to": "Milestone", "position": 3},
        {"category_name": "CSM", "applies_to": "Milestone", "position": 4},
        {"category_name": "Invoice", "applies_to": "Milestone", "position": 5},
        {"category_name": "Other", "applies_to": "Milestone", "position": 6},
        {"category_name": "External Meeting", "applies_to": "Touchpoint", "position": 1},
        {"category_name": "Internal Meeting", "applies_to": "Touchpoint", "position": 2},
        {"category_name": "Follow-up", "applies_to": "Touchpoint", "position": 3},
        {"category_name": "Check-in", "applies_to": "Touchpoint", "position": 4},
        {"category_name": "Other", "applies_to": "Touchpoint", "position": 5},
    )

    for category in categories:
        identity = {"category_name": category["category_name"], "applies_to": category["applies_to"]}
        if frappe.db.exists("Project Timeline Item Category", identity):
            continue

        frappe.get_doc({"doctype": "Project Timeline Item Category", **category}).insert(ignore_permissions=True)


def create_default_growth_masters():
    growth_categories = ("Upsell", "Cross-sell", "Renewal/Extension", "New Service", "Referral")
    growth_statuses = (
        {"name": "Ideation", "status_type": "Status"},
        {"name": "In Progress", "status_type": "Status"},
        {"name": "On Hold", "status_type": "Status"},
        {"name": "Closed", "status_type": "Status", "is_closed": 1},
        {"name": "Won", "status_type": "Closed Status"},
        {"name": "Lost", "status_type": "Closed Status"},
        {"name": "Not Pursued", "status_type": "Closed Status"},
    )

    _insert_masters("PMS Growth Initiative Category", [{"name": name} for name in growth_categories])
    _insert_masters("PMS Growth Initiative Status", growth_statuses)


def _insert_masters(doctype, records):
    import frappe

    for record in records:
        if frappe.db.exists(doctype, record["name"]):
            continue

        frappe.get_doc({"doctype": doctype, **record}).insert(ignore_permissions=True)
