# Copyright (c) 2026, rtCamp and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase

from next_pms.install import create_default_timeline_item_categories

EXPECTED_CATEGORIES = {
    "Contract - Milestone": ("Contract", "Milestone", 1),
    "Delivery - Milestone": ("Delivery", "Milestone", 2),
    "Client-Requested - Milestone": ("Client-Requested", "Milestone", 3),
    "CSM - Milestone": ("CSM", "Milestone", 4),
    "Invoice - Milestone": ("Invoice", "Milestone", 5),
    "Other - Milestone": ("Other", "Milestone", 6),
    "External Meeting - Touchpoint": ("External Meeting", "Touchpoint", 1),
    "Internal Meeting - Touchpoint": ("Internal Meeting", "Touchpoint", 2),
    "Follow-up - Touchpoint": ("Follow-up", "Touchpoint", 3),
    "Check-in - Touchpoint": ("Check-in", "Touchpoint", 4),
    "Other - Touchpoint": ("Other", "Touchpoint", 5),
}


class IntegrationTestProjectTimelineItemCategory(IntegrationTestCase):
    def test_seeded_categories_exist(self):
        for name, (category_name, applies_to, position) in EXPECTED_CATEGORIES.items():
            row = frappe.db.get_value(
                "Project Timeline Item Category",
                name,
                ["category_name", "applies_to", "position"],
                as_dict=True,
            )
            self.assertIsNotNone(row, msg=name)
            self.assertEqual((row.category_name, row.applies_to, row.position), (category_name, applies_to, position))

    def test_both_types_share_the_other_label(self):
        # The name disambiguates; title_field surfaces the bare label to the user.
        for item_type in ("Milestone", "Touchpoint"):
            self.assertEqual(
                frappe.db.get_value("Project Timeline Item Category", f"Other - {item_type}", "category_name"),
                "Other",
            )

    def test_label_is_the_link_title(self):
        meta = frappe.get_meta("Project Timeline Item Category")
        self.assertEqual(meta.title_field, "category_name")
        self.assertTrue(meta.show_title_field_in_link)

    def test_seeder_is_idempotent(self):
        before = frappe.db.count("Project Timeline Item Category")
        create_default_timeline_item_categories()
        self.assertEqual(frappe.db.count("Project Timeline Item Category"), before)

    def test_positions_are_contiguous_from_one_per_type(self):
        for item_type in ("Milestone", "Touchpoint"):
            positions = frappe.get_all(
                "Project Timeline Item Category",
                filters={"applies_to": item_type},
                order_by="position asc",
                pluck="position",
            )
            self.assertEqual(positions, list(range(1, len(positions) + 1)))

    def test_catch_all_sorts_last_within_its_type(self):
        for item_type in ("Milestone", "Touchpoint"):
            names = frappe.get_all(
                "Project Timeline Item Category",
                filters={"applies_to": item_type},
                order_by="position asc",
                pluck="name",
            )
            self.assertEqual(names[-1], f"Other - {item_type}")

    def test_same_label_cannot_repeat_within_a_type(self):
        with self.assertRaises(frappe.DuplicateEntryError):
            frappe.get_doc(
                {
                    "doctype": "Project Timeline Item Category",
                    "category_name": "Contract",
                    "applies_to": "Milestone",
                }
            ).insert(ignore_permissions=True)

    def test_categories_cannot_be_renamed(self):
        with self.assertRaisesRegex(frappe.ValidationError, "not allowed to be renamed"):
            frappe.rename_doc("Project Timeline Item Category", "Other - Milestone", "Misc - Milestone")

    def test_applies_to_cannot_change(self):
        category = frappe.get_doc("Project Timeline Item Category", "Contract - Milestone")
        category.applies_to = "Touchpoint"
        with self.assertRaises(frappe.CannotChangeConstantError):
            category.save(ignore_permissions=True)

    def test_fallback_category_cannot_be_deleted(self):
        for item_type in ("Milestone", "Touchpoint"):
            with self.assertRaisesRegex(frappe.ValidationError, "fallback category"):
                frappe.delete_doc("Project Timeline Item Category", f"Other - {item_type}", ignore_permissions=True)
            self.assertTrue(frappe.db.exists("Project Timeline Item Category", f"Other - {item_type}"))

    def test_label_is_readable_with_select_permission(self):
        self.assertIn("category_name", frappe.get_meta("Project Timeline Item Category").get_search_fields())
