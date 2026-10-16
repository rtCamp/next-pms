def before_insert(doc, method=None):
    copy_tech_stack_from_deal(doc)


def copy_tech_stack_from_deal(doc):
    import frappe

    deal = doc.get("custom_deal")
    if doc.get("tech_stack") or not deal:
        return

    technologies = frappe.get_all(
        "Tech Stack Item",
        filters={"parenttype": "CRM Deal", "parent": deal, "parentfield": "tech_stack"},
        order_by="idx",
        pluck="technology",
    )
    for technology in technologies:
        doc.append("tech_stack", {"technology": technology})


def validate(doc, method=None):
    validate_tech_stack(doc)


def validate_tech_stack(doc):
    import frappe
    from frappe import _

    if doc.custom_billing_type == "Non-Billable" or doc.get("tech_stack"):
        return
    if doc.is_new() or doc.has_value_changed("custom_billing_type"):
        frappe.throw(_("Tech Stack is required for billable projects."), title=_("Missing Tech Stack"))


def on_update(doc, method=None):
    share_project_with_employee(doc)


def share_project_with_employee(doc):
    import frappe
    import frappe.share
    from frappe import get_value

    if doc.custom_billing_type and doc.custom_billing_type != "Time and Material":
        return
    employee_set = set()
    for team in doc.custom_project_billing_team:
        employee_set.add(team.employee)

    if not employee_set:
        return
    for employee in employee_set:
        user = get_value("Employee", employee, "user_id")
        already_shared = frappe.db.exists(
            "DocShare",
            {"user": user, "share_name": doc.name, "share_doctype": "Project"},
        )
        if not user or already_shared:
            continue
        frappe.share.add_docshare("Project", doc.name, user=user, flags={"ignore_share_permission": True})
