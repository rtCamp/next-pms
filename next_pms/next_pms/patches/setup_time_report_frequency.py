import frappe

from next_pms.install import setup_time_report_frequency


def execute():
    setup_time_report_frequency()

    project = frappe.qb.DocType("Project")
    frappe.qb.update(project).set(project.collect_progress, 0).where(project.collect_progress == 1).run()
    frappe.qb.update(project).set(project.custom_time_report_frequency, "Weekly").where(
        project.frequency == "Weekly"
    ).run()
