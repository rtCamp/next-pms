import os

from frappe import _, get_app_path, get_doc, read_file


def after_install():
    create_roles()
    add_project_manager_perm()
    setup_email_template()
    create_default_project_phases()
    create_default_risk_masters()
    setup_project_custom_fields()
    setup_project_target_hours_field()
    setup_timesheet_rejection_reason_field()
    setup_timesheet_weekly_rejection_reason_field()
    setup_task_permissions()
    setup_time_report_frequency()


def setup_timesheet_rejection_reason_field():
    from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

    create_custom_fields(
        {
            "Timesheet": [
                {
                    "fieldname": "custom_rejection_reason",
                    "fieldtype": "Text Editor",
                    "label": "Rejection Reason",
                    "insert_after": "note",
                    "depends_on": 'eval:doc.custom_approval_status=="Rejected"',
                    "read_only": 1,
                    "no_copy": 1,
                    "module": "Timesheet",
                },
            ]
        }
    )


def setup_timesheet_weekly_rejection_reason_field():
    from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

    create_custom_fields(
        {
            "Timesheet": [
                {
                    "fieldname": "custom_weekly_rejection_reason",
                    "fieldtype": "Text Editor",
                    "label": "Weekly Rejection Reason",
                    "insert_after": "custom_rejection_reason",
                    "depends_on": 'eval:doc.custom_weekly_approval_status=="Rejected"',
                    "read_only": 1,
                    "no_copy": 1,
                    "module": "Timesheet",
                },
            ]
        }
    )


def setup_project_target_hours_field():
    from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

    create_custom_fields(
        {
            "Project": [
                {
                    "fieldname": "custom_target_hours",
                    "fieldtype": "Float",
                    "label": "Target Hours",
                    "insert_after": "percent_complete",
                },
            ]
        }
    )


def setup_time_report_frequency():
    import frappe
    from frappe.custom.doctype.custom_field.custom_field import create_custom_fields
    from frappe.custom.doctype.property_setter.property_setter import make_property_setter

    create_custom_fields(
        {
            "Project": [
                {
                    "fieldname": "custom_time_report_frequency",
                    "fieldtype": "Link",
                    "label": "Time Report Frequency",
                    "options": "Project Time Report Frequency",
                    "insert_after": "custom_duration",
                },
            ]
        }
    )

    for frequency in ("Weekly", "Bi-weekly", "Monthly"):
        if not frappe.db.exists("Project Time Report Frequency", frequency):
            frappe.get_doc({"doctype": "Project Time Report Frequency", "name": frequency}).insert(
                ignore_permissions=True
            )

    make_property_setter("Project", "collect_progress", "hidden", 1, "Check")


def setup_project_custom_fields():
    from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

    create_custom_fields(
        {
            "Project": [
                {
                    "fieldname": "custom_lifetime_value_to_date",
                    "fieldtype": "Currency",
                    "label": "Lifetime Value To Date",
                    "insert_after": "gross_margin",
                    "depends_on": 'eval:doc.custom_billing_type=="Fixed Cost" || doc.custom_billing_type=="Retainer" || doc.custom_billing_type=="Time and Material"',
                    "options": "custom_currency",
                    "permlevel": 2,
                    "read_only": 0,
                },
                {
                    "fieldname": "custom_expected_lifetime_value",
                    "fieldtype": "Currency",
                    "label": "Expected Lifetime Value",
                    "insert_after": "custom_lifetime_value_to_date",
                    "depends_on": 'eval:doc.custom_billing_type=="Fixed Cost" || doc.custom_billing_type=="Retainer" || doc.custom_billing_type=="Time and Material"',
                    "options": "custom_currency",
                    "permlevel": 2,
                    "read_only": 0,
                },
                {
                    "fieldname": "custom_lifetime_value_vs_billed_amount",
                    "fieldtype": "Currency",
                    "label": "Lifetime Value vs Billed Amount",
                    "insert_after": "custom_expected_lifetime_value",
                    "depends_on": 'eval:doc.custom_billing_type=="Fixed Cost" || doc.custom_billing_type=="Retainer" || doc.custom_billing_type=="Time and Material"',
                    "options": "custom_currency",
                    "permlevel": 2,
                    "read_only": 0,
                },
            ]
        }
    )


def setup_task_permissions():
    import frappe
    from frappe.core.doctype.doctype.doctype import validate_permissions_for_doctype
    from frappe.permissions import add_permission, setup_custom_perms, update_permission_property

    doctype = "Task"
    permissions = {"read": 1, "write": 1, "create": 1, "delete": 1}

    for role in ("Projects Manager", "Delivery Manager", "Delivery User"):
        if not frappe.db.exists("Role", role):
            continue
        add_permission(doctype, role, 0)
        for perm_key, perm_val in permissions.items():
            update_permission_property(doctype, role, 0, perm_key, perm_val)

    if not frappe.db.exists("Role", "Employee"):
        return

    setup_custom_perms(doctype)
    if not frappe.db.exists("Custom DocPerm", {"parent": doctype, "role": "Employee", "permlevel": 0, "if_owner": 1}):
        frappe.get_doc(
            {
                "doctype": "Custom DocPerm",
                "parent": doctype,
                "parenttype": "DocType",
                "parentfield": "permissions",
                "role": "Employee",
                "permlevel": 0,
                "if_owner": 1,
                **permissions,
            }
        ).insert(ignore_permissions=True)
        validate_permissions_for_doctype(doctype)


def add_project_manager_perm():
    from frappe.permissions import add_permission, update_permission_property

    role = "Projects Manager"
    doctype = "Timesheet"
    perm_level = 0
    permissions = {
        perm_level: {
            "create": 0,
            "read": 0,
            "delete": 0,
            "write": 0,
            "export": 0,
            "submit": 1,
        }
    }
    add_permission(doctype, role, perm_level)
    for perm_key, perm_val in permissions[perm_level].items():
        update_permission_property(doctype, role, perm_level, perm_key, perm_val)


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


def create_docs(records: list):
    for doc in records:
        get_doc(doc).insert(ignore_permissions=True, ignore_mandatory=True, ignore_if_duplicate=True)


def create_roles():
    import frappe

    roles = ["Timesheet Manager", "Timesheet User"]

    for role in roles:
        role = frappe.get_doc({"doctype": "Role", "role_name": role, "is_custom": 1})
        role.insert(ignore_permissions=True, ignore_if_duplicate=True)


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
    import frappe

    risk_categories = ("Internal Team", "Client", "Design", "Technical", "Timeline/Budget")
    risk_levels = ("Low", "Medium", "High")
    risk_statuses = ("To-do", "In Progress", "Escalated", "Blocked", "Mitigated")

    for doctype, names in (
        ("Risk Category", risk_categories),
        ("Risk Level", risk_levels),
        ("Risk Status", risk_statuses),
    ):
        for name in names:
            if frappe.db.exists(doctype, name):
                continue

            frappe.get_doc({"doctype": doctype, "name": name}).insert(ignore_permissions=True)
