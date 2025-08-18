import frappe

from next_pms.project_currency.helpers.error import generate_the_error_log


@frappe.whitelist()
def calculate(project_id: str, valid_from_date: str):
    if not project_id:
        return frappe.throw(frappe._("Please select a project."))

    frappe.enqueue(
        recalculate_timesheet_billing,
        job_name=f"recalculate_timesheet_billing_{project_id}",
        queue="long",
        timeout=3600,
        project_id=project_id,
        valid_from_date=valid_from_date,
    )

    return frappe.msgprint(frappe._("Timesheet billing recalculation has started."))


def recalculate_timesheet_billing(project_id: str, valid_from_date: str, start: int = 0):
    try:
        timsheets = frappe.get_all(
            "Timesheet",
            filters={"parent_project": project_id, "start_date": [">=", valid_from_date]},
            fields=["name"],
            limit_start=start,
            limit_page_length=300,
            order_by="start_date asc",
        )

        if not timsheets or len(timsheets) < 1:
            project_name = frappe.db.get_value("Project", project_id, "project_name")
            if start == 0:
                return frappe.msgprint(
                    f"No Timesheets found for the project with ID: {project_id}-{project_name}.",
                    realtime=True,
                )
            else:
                project_doc = frappe.get_doc("Project", project_id)
                project_doc.update_project()
                project_doc.save(ignore_permissions=True)

                return frappe.msgprint(
                    f"Timesheet billing recalculation completed for project: {project_id}-{project_name}.",
                    realtime=True,
                )

        for timesheet in timsheets:
            timesheet_doc = frappe.get_doc("Timesheet", timesheet.name)
            timesheet_doc.flags.ignore_validate_update_after_submit = True
            timesheet_doc.validate()
            timesheet_doc.ignore_backdated_validation = True
            timesheet_doc.save(ignore_permissions=True)

        frappe.enqueue(
            recalculate_timesheet_billing,
            job_name=f"recalculate_timesheet_billing_{project_id}",
            queue="long",
            timeout=3600,
            project_id=project_id,
            valid_from_date=valid_from_date,
            start=start + 300,
        )
    except Exception:
        generate_the_error_log(
            f"recalculate_timesheet_billing_{project_id}_failed",
            user_error_message="The data for timesheet billing sync has failed.",
        )
