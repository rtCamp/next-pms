import frappe
from frappe import get_all, get_doc


def execute():
    frappe.enqueue(
        update_task_and_project_costing,
        queue="long",
        job_name="Update task and project costing for timesheet",
    )


def update_task_and_project_costing(batch_size=100, start=0):
    timesheets = get_all(
        "Timesheet",
        filters={"docstatus": ["in", [0, 1]]},
        pluck="name",
        limit_start=start,
        limit_page_length=batch_size,
        order_by="creation asc",
    )

    if not timesheets:
        frappe.logger().info("All timesheets processed.")
        return

    try:
        for name in timesheets:
            doc = get_doc("Timesheet", name)
            doc.update_task_and_project()

        frappe.db.commit()

        frappe.enqueue(
            "next_pms.timesheet.patches.update_task_and_project_costing.update_task_and_project_costing",
            batch_size=batch_size,
            start=start + batch_size,
            queue="long",
        )
    except frappe.exceptions.TimestampMismatchError as e:
        frappe.logger().error(f"Timestamp mismatch error encountered: {e}")

        frappe.enqueue(
            "next_pms.timesheet.patches.update_task_and_project_costing.update_task_and_project_costing",
            batch_size=batch_size,
            start=start,
            queue="long",
        )
