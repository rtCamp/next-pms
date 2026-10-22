import unittest

import frappe
from frappe.tests import IntegrationTestCase

from next_pms.install import create_default_growth_masters
from next_pms.next_pms.patches.merge_growth_initiative_owners import execute

DOCTYPE = "PMS Growth Initiative"
OWNER = "test.growth.merge.owner@example.com"
IDEATOR = "test.growth.merge.ideator@example.com"
PM = "test.growth.merge.pm@example.com"


class TestMergeGrowthInitiativeOwners(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        create_default_growth_masters()
        for email in (OWNER, IDEATOR, PM):
            if not frappe.db.exists("User", email):
                frappe.get_doc(
                    {"doctype": "User", "email": email, "first_name": email.split("@")[0], "send_welcome_email": 0}
                ).insert(ignore_permissions=True)
        cls.project = frappe.get_doc(
            {"doctype": "Project", "project_name": f"Growth Merge {frappe.generate_hash(length=6)}"}
        ).insert(ignore_permissions=True)

    def make_initiative(self, **values):
        doc = frappe.get_doc(
            {"doctype": DOCTYPE, "project": self.project.name, "activity": "Merge test", "status": "Ideation"}
        ).insert(ignore_permissions=True)
        frappe.db.set_value(DOCTYPE, doc.name, values, update_modified=False)
        return doc.name

    def test_pm_is_filled_from_the_project_only_when_empty(self):
        frappe.db.set_value("Project", self.project.name, "custom_project_manager", PM)
        empty = self.make_initiative(project_manager=None)
        kept = self.make_initiative(project_manager=OWNER)

        execute()

        self.assertEqual(frappe.db.get_value(DOCTYPE, empty, "project_manager"), PM)
        self.assertEqual(frappe.db.get_value(DOCTYPE, kept, "project_manager"), OWNER)

    def test_ideation_owner_fills_an_empty_owner_only(self):
        if not frappe.db.has_column(DOCTYPE, "ideation_owner"):
            raise unittest.SkipTest("ideation_owner column is not present on this site")
        empty = self.make_initiative(activity_owner=None, ideation_owner=IDEATOR)
        kept = self.make_initiative(activity_owner=OWNER, ideation_owner=IDEATOR)

        execute()

        self.assertEqual(frappe.db.get_value(DOCTYPE, empty, "activity_owner"), IDEATOR)
        self.assertEqual(frappe.db.get_value(DOCTYPE, kept, "activity_owner"), OWNER)
