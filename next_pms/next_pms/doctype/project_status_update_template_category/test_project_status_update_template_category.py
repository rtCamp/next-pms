# Copyright (c) 2026, rtCamp and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase

# On IntegrationTestCase, the doctype test records and all
# link-field test record dependencies are recursively loaded
# Use these module variables to add/remove to/from that list
EXTRA_TEST_RECORD_DEPENDENCIES = []  # eg. ["User"]
IGNORE_TEST_RECORD_DEPENDENCIES = []  # eg. ["User"]

CATEGORY_DOCTYPE = "Project Status Update Template Category"
TEMPLATE_DOCTYPE = "Project Status Update Template"


class IntegrationTestProjectStatusUpdateTemplateCategory(IntegrationTestCase):
    """
    Integration tests for ProjectStatusUpdateTemplateCategory.
    Use this class for testing interactions between multiple components.
    """

    def make_category(self, name):
        return frappe.get_doc({"doctype": CATEGORY_DOCTYPE, "__newname": name}).insert()

    def make_template(self, template_name, category=None):
        return frappe.get_doc(
            {
                "doctype": TEMPLATE_DOCTYPE,
                "template_name": template_name,
                "description": "Status update body",
                "category": category,
            }
        ).insert()

    def test_category_is_named_from_prompt(self):
        category = self.make_category("_Test PSU Category Naming")
        self.assertEqual(category.name, "_Test PSU Category Naming")
        self.assertTrue(frappe.db.exists(CATEGORY_DOCTYPE, category.name))

    def test_template_links_to_category(self):
        category = self.make_category("_Test PSU Category Linked")
        template = self.make_template("_Test PSU Template Linked", category.name)
        self.assertEqual(template.category, category.name)

    def test_template_rejects_unknown_category(self):
        self.assertRaises(
            frappe.LinkValidationError,
            self.make_template,
            "_Test PSU Template Bad Link",
            "_Test PSU Category Missing",
        )

    def test_rename_propagates_to_linked_templates(self):
        category = self.make_category("_Test PSU Category Old Name")
        template = self.make_template("_Test PSU Template Renamed", category.name)
        frappe.rename_doc(CATEGORY_DOCTYPE, category.name, "_Test PSU Category New Name")
        template.reload()
        self.assertEqual(template.category, "_Test PSU Category New Name")

    def test_delete_is_blocked_while_templates_reference_category(self):
        category = self.make_category("_Test PSU Category Referenced")
        self.make_template("_Test PSU Template Reference", category.name)
        self.assertRaises(frappe.LinkExistsError, category.delete)

    def test_delete_unreferenced_category(self):
        category = self.make_category("_Test PSU Category Deletable")
        category.delete()
        self.assertFalse(frappe.db.exists(CATEGORY_DOCTYPE, "_Test PSU Category Deletable"))
