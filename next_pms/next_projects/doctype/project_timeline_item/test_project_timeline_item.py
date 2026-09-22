# Copyright (c) 2026, rtCamp and Contributors
# See license.txt

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, nowdate

# setUpClass makes its own Project and runs as Administrator, so frappe need not generate
# test records for either link target — both chains reach unrelated apps and fail there.
EXTRA_TEST_RECORD_DEPENDENCIES = []
IGNORE_TEST_RECORD_DEPENDENCIES = ["Project", "User"]

MILESTONE_CATEGORIES = (
    "Contract - Milestone",
    "Delivery - Milestone",
    "Client-Requested - Milestone",
    "CSM - Milestone",
    "Invoice - Milestone",
    "Other - Milestone",
)
TOUCHPOINT_CATEGORIES = (
    "External Meeting - Touchpoint",
    "Internal Meeting - Touchpoint",
    "Follow-up - Touchpoint",
    "Check-in - Touchpoint",
    "Other - Touchpoint",
)


class IntegrationTestProjectTimelineItem(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.project = (
            frappe.get_doc(
                {
                    "doctype": "Project",
                    "project_name": "TimelineCategory Validation",
                    "company": get_default_company(),
                }
            )
            .insert(ignore_permissions=True)
            .name
        )
        frappe.set_user("Administrator")

    def make_item(self, item_type="Milestone", **overrides):
        return frappe.get_doc(
            {
                "doctype": "Project Timeline Item",
                "title": "Category case",
                "project": self.project,
                "type": item_type,
                "start_date": nowdate(),
                "planned_end_date": add_days(nowdate(), 1),
                "item_owner": "Administrator",
                **overrides,
            }
        ).insert(ignore_permissions=True)

    def test_category_defaults_to_catch_all(self):
        for item_type in ("Milestone", "Touchpoint"):
            self.assertEqual(self.make_item(item_type).category, f"Other - {item_type}")

    def test_blank_category_is_coerced(self):
        self.assertEqual(self.make_item(category="").category, "Other - Milestone")

    def test_milestone_accepts_milestone_categories(self):
        for category in MILESTONE_CATEGORIES:
            self.assertEqual(self.make_item("Milestone", category=category).category, category)

    def test_touchpoint_accepts_touchpoint_categories(self):
        for category in TOUCHPOINT_CATEGORIES:
            self.assertEqual(self.make_item("Touchpoint", category=category).category, category)

    def test_milestone_rejects_touchpoint_category(self):
        with self.assertRaises(frappe.ValidationError):
            self.make_item("Milestone", category="Check-in - Touchpoint")

    def test_touchpoint_rejects_milestone_category(self):
        with self.assertRaises(frappe.ValidationError):
            self.make_item("Touchpoint", category="Contract - Milestone")

    def test_unknown_category_is_rejected(self):
        with self.assertRaises(frappe.ValidationError):
            self.make_item("Milestone", category="No Such Category")

    def test_is_internal_defaults_to_zero(self):
        self.assertEqual(self.make_item().is_internal, 0)

    def test_is_internal_persists(self):
        name = self.make_item(is_internal=1).name
        self.assertEqual(frappe.db.get_value("Project Timeline Item", name, "is_internal"), 1)

    def test_touchpoint_start_date_falls_back_to_planned_end_date(self):
        item = self.make_item("Touchpoint", start_date=None)
        self.assertEqual(item.start_date, item.planned_end_date)
