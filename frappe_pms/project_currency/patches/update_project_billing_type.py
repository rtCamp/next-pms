import frappe


def execute():
    all_projects = frappe.get_all(
        "Project",
        fields=["name"],
    )

    for project in all_projects:
        project = frappe.get_doc("Project", project.name)
        if project.project_type:
            if (
                project.project_type == "TnM"
                or project.project_type == "Staff Augmentation"
            ):
                project.custom_billing_type = "Time and Material"
            elif project.project_type == "Retainer":
                project.custom_billing_type = "Retainer"
            elif project.project_type == "Fixed Cost":
                project.custom_billing_type = "Fixed Cost"
            else:
                project.custom_billing_type = "Non-Billable"
        else:
            project.custom_billing_type = "Non-Billable"

        project.save()

        if (
            project.custom_billing_type == "Retainer"
            or project.custom_billing_type == "Fixed Cost"
        ) and project.custom_budget_in_hours:
            custom_project_budget_hours = frappe.get_doc(
                {
                    "doctype": "Project Budget",
                    "parent": project.name,
                    "parenttype": "Project",
                    "parentfield": "custom_project_budget_hours",
                    "start_date": "2024-10-01",
                    "end_date": "2025-10-01",
                    "hours_purchased": project.custom_budget_in_hours,
                }
            )
            custom_project_budget_hours.insert()
        frappe.db.commit()
