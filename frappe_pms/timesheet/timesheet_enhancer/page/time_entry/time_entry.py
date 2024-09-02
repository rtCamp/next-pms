import frappe


@frappe.whitelist()
def get_time_log_docfield_and_data(employee, date):
    fields = frappe.get_all(
        "DocField",
        filters={
            "parent": "Timesheet Detail",
            "fieldname": [
                "in",
                [
                    "activity_type",
                    "project",
                    "project_name",
                    "from_time",
                    "to_time",
                    "hours",
                    "description",
                ],
            ],
        },
        fields="*",
    )
    name = frappe.db.get_value(
        "Timesheet",
        {
            "employee": employee,
            "start_date": date,
            "end_date": date,
        },
        "name",
    )
    if not name:
        return {"fields": fields, "data": []}

    data = frappe.db.get_all(
        "Timesheet Detail",
        filters={"parent": name},
        fields=[
            "activity_type",
            "project",
            "project_name",
            "from_time",
            "to_time",
            "hours",
            "description",
        ],
    )
    return {"fields": fields, "data": data}


@frappe.whitelist()
def save(doc, date):
    from frappe.client import save as save_doc
    from frappe.utils import get_link_to_form, getdate

    parsed_doc = frappe.parse_json(doc)
    name = frappe.db.get_value(
        "Timesheet",
        {
            "employee": parsed_doc.get("employee"),
            "start_date": getdate(date),
            "end_date": getdate(date),
        },
        "name",
    )
    if not name:
        doc = save_doc(doc)
        return f"Timesheet created successfully. You can view the timesheet {get_link_to_form('Timesheet', doc.name)}."
    # Remove the name field from the time_logs, to be able to update the time_logs
    # Update the parent record to make sure the doc events are fired.
    time_logs = parsed_doc.get("time_logs")
    for time_log in time_logs:
        time_log.pop("name", None)

    new_doc = frappe.get_doc("Timesheet", name)
    new_doc.update(
        {
            "time_logs": parsed_doc.get("time_logs"),
        }
    )
    new_doc.save()
    return f"Timesheet updated successfully. You can view the timesheet {get_link_to_form('Timesheet', new_doc.name)}."
