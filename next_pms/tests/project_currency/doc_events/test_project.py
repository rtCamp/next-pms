import frappe
from frappe.tests import IntegrationTestCase

from next_pms.install import setup_crm_deal_tech_stack_field
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


class TestProjectTechStackFromDeal(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        if not frappe.db.exists("DocType", "CRM Deal") or not frappe.get_meta("Project").has_field("custom_deal"):
            raise cls.skipTest(cls, "CRM is not installed")
        setup_crm_deal_tech_stack_field()

    def new_deal(self, *technologies):
        rows = [row for technology in technologies for row in make_tech_stack(technology)]
        return frappe.get_doc({"doctype": "CRM Deal", "tech_stack": rows}).insert(ignore_permissions=True)

    def new_project(self, deal, **values):
        return frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": f"Tech Stack Deal {frappe.generate_hash(length=8)}",
                "custom_billing_type": "Fixed Cost",
                "custom_deal": deal.name,
                **values,
            }
        )

    def test_setup_adds_tech_stack_to_crm_deal(self):
        self.assertEqual(frappe.get_meta("CRM Deal").get_field("tech_stack").options, "Tech Stack Item")

    def test_project_from_deal_gets_deal_tech_stack(self):
        project = self.new_project(self.new_deal("Frappe")).insert(ignore_permissions=True)
        self.assertEqual([row.technology for row in project.tech_stack], ["Frappe"])

    def test_project_tech_stack_is_not_overwritten_by_deal(self):
        project = self.new_project(self.new_deal("Frappe"), tech_stack=make_tech_stack("Drupal"))
        project.insert(ignore_permissions=True)
        self.assertEqual([row.technology for row in project.tech_stack], ["Drupal"])

    def test_billable_project_from_deal_without_tech_stack_is_rejected(self):
        with self.assertRaises(frappe.ValidationError):
            self.new_project(self.new_deal()).insert(ignore_permissions=True)
