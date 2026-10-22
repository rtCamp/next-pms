import frappe


def execute():
    """Give each Growth Initiative its project's customer as its client."""
    frappe.db.sql(
        """
        update `tabPMS Growth Initiative` initiative
        join `tabProject` project on project.name = initiative.project
        set initiative.customer = project.customer
        where ifnull(initiative.customer, '') = '' and ifnull(project.customer, '') != ''
        """
    )
