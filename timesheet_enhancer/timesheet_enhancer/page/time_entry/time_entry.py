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
        ],
    )
    return {"fields": fields, "data": data}
