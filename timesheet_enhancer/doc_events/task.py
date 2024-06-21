def before_save(doc, method=None):
    from frappe import get_value

    if doc.project is None:
        return
    project_type = get_value("Project", doc.project, "project_type")
    if project_type is None:
        return

    is_billable = get_value("Project Type", project_type, "custom_is_billable")
    doc.custom_is_billable = is_billable
