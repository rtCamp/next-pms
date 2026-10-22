import frappe

DOCTYPE = "PMS Growth Initiative"


def execute():
    """Fold Ideation Owner into Owner where Owner is empty, and fill PM from the project."""
    if frappe.db.has_column(DOCTYPE, "ideation_owner"):
        frappe.db.sql(
            """
            update `tabPMS Growth Initiative`
            set activity_owner = ideation_owner
            where ifnull(activity_owner, '') = '' and ifnull(ideation_owner, '') != ''
            """
        )

    project_managers = dict(
        frappe.get_all(
            "Project",
            filters={"custom_project_manager": ["is", "set"]},
            fields=["name", "custom_project_manager"],
            as_list=True,
        )
    )
    for initiative in frappe.get_all(
        DOCTYPE, filters={"project_manager": ["is", "not set"]}, fields=["name", "project"]
    ):
        if project_manager := project_managers.get(initiative.project):
            frappe.db.set_value(DOCTYPE, initiative.name, "project_manager", project_manager, update_modified=False)
