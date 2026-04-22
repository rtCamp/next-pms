import frappe

from next_pms.install import create_default_project_phases


def execute():
    ## sanity check : if the phases were already created, renamed or deleted, do not create them again
    if frappe.db.count("Project Phase") > 0:
        return
    create_default_project_phases()
