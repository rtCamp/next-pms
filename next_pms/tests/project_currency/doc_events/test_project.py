import frappe
from frappe.tests import IntegrationTestCase

from next_pms.tests.utils import make_tech_stack


class TestProjectTechStack(IntegrationTestCase):
    @staticmethod
    def new_project(billing_type, tech_stack=None):
        return frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": f"Tech Stack {frappe.generate_hash(length=8)}",
                "custom_billing_type": billing_type,
                "tech_stack": tech_stack or [],
            }
        )

    def test_new_billable_project_requires_tech_stack(self):
        for billing_type in ("Fixed Cost", "Retainer", "Time and Material"):
            with self.subTest(billing_type=billing_type), self.assertRaises(frappe.ValidationError):
                self.new_project(billing_type).insert(ignore_permissions=True)

    def test_new_billable_project_with_tech_stack_saves(self):
        project = self.new_project("Fixed Cost", make_tech_stack()).insert(ignore_permissions=True)
        self.assertEqual([row.technology for row in project.tech_stack], ["Frappe"])

    def test_new_non_billable_project_does_not_require_tech_stack(self):
        self.new_project("Non-Billable").insert(ignore_permissions=True)

    def test_existing_billable_project_without_tech_stack_can_be_edited(self):
        project = self.new_project("Fixed Cost", make_tech_stack()).insert(ignore_permissions=True)
        frappe.db.delete("Tech Stack Item", {"parenttype": "Project", "parent": project.name})

        project.reload()
        project.notes = "Edited before backfill"
        project.save(ignore_permissions=True)

    def test_switching_to_billable_requires_tech_stack(self):
        project = self.new_project("Non-Billable").insert(ignore_permissions=True)
        project.reload()

        project.custom_billing_type = "Retainer"
        with self.assertRaises(frappe.ValidationError):
            project.save(ignore_permissions=True)

        project.reload()
        project.custom_billing_type = "Retainer"
        project.extend("tech_stack", make_tech_stack())
        project.save(ignore_permissions=True)
