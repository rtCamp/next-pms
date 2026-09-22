import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, nowdate

from next_pms.next_projects.api.project_timeline_item import (
    create_project_timeline_item,
    edit_project_timeline_item,
    get_project_timeline_items,
)


class TestProjectTimelineItemSearch(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        company = get_default_company()

        def make_project(project_name):
            return (
                frappe.get_doc(
                    {
                        "doctype": "Project",
                        "project_name": project_name,
                        "company": company,
                    }
                )
                .insert(ignore_permissions=True)
                .name
            )

        cls.project = make_project("TimelineSearch Primary")
        cls.other_project = make_project("TimelineSearch Other")

        titles = [
            ("Alpha Launch", cls.project),
            ("alpha internal sync", cls.project),
            ("Beta Review", cls.project),
            ("Roadmap checkpoint", cls.project),
            ("Alpha Launch", cls.other_project),
        ]
        for index, (title, project) in enumerate(titles):
            frappe.get_doc(
                {
                    "doctype": "Project Timeline Item",
                    "title": title,
                    "project": project,
                    "type": "Milestone",
                    "start_date": add_days(nowdate(), index),
                    "planned_end_date": add_days(nowdate(), index + 1),
                    "item_owner": "Administrator",
                }
            ).insert(ignore_permissions=True)

        frappe.set_user("Administrator")

    def test_search_filters_by_title_substring(self):
        result = get_project_timeline_items(self.project, search="Alpha")
        titles = [item["title"] for item in result["data"]]
        self.assertEqual(sorted(titles), ["Alpha Launch", "alpha internal sync"])
        self.assertEqual(result["total_count"], 2)

    def test_search_is_case_insensitive(self):
        for term in ("ALPHA", "alpha", "aLpHa"):
            result = get_project_timeline_items(self.project, search=term)
            self.assertEqual(result["total_count"], 2, msg=term)

    def test_search_matches_middle_of_title(self):
        result = get_project_timeline_items(self.project, search="checkpoint")
        titles = [item["title"] for item in result["data"]]
        self.assertEqual(titles, ["Roadmap checkpoint"])

    def test_no_search_returns_all_items(self):
        for search in (None, ""):
            result = get_project_timeline_items(self.project, search=search)
            self.assertEqual(result["total_count"], 4, msg=repr(search))

    def test_search_with_no_matches_returns_empty(self):
        result = get_project_timeline_items(self.project, search="nonexistent")
        self.assertEqual(result["data"], [])
        self.assertEqual(result["total_count"], 0)
        self.assertFalse(result["has_more"])

    def test_search_is_scoped_to_project(self):
        result = get_project_timeline_items(self.other_project, search="Alpha")
        self.assertEqual(result["total_count"], 1)
        self.assertEqual(result["data"][0]["project"], self.other_project)

    def test_search_total_count_drives_pagination(self):
        result = get_project_timeline_items(self.project, limit=1, search="Alpha")
        self.assertEqual(len(result["data"]), 1)
        self.assertEqual(result["total_count"], 2)
        self.assertTrue(result["has_more"])

        last_page = get_project_timeline_items(self.project, start=1, limit=1, search="Alpha")
        self.assertEqual(len(last_page["data"]), 1)
        self.assertFalse(last_page["has_more"])


class TestProjectTimelineItemCategory(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.project = (
            frappe.get_doc(
                {
                    "doctype": "Project",
                    "project_name": "TimelineCategory API",
                    "company": get_default_company(),
                }
            )
            .insert(ignore_permissions=True)
            .name
        )
        frappe.set_user("Administrator")

    def create(self, **overrides):
        payload = {
            "project": self.project,
            "type": "Milestone",
            "title": "Category API case",
            "item_owner": "Administrator",
            "start_date": nowdate(),
            "planned_end_date": add_days(nowdate(), 1),
        }
        payload.update(overrides)
        return create_project_timeline_item(**payload)

    def test_create_persists_category_and_is_internal(self):
        created = self.create(category="Invoice - Milestone", is_internal=1)
        self.assertEqual(created["category"], "Invoice - Milestone")
        self.assertEqual(created["is_internal"], 1)

        stored = frappe.db.get_value(
            "Project Timeline Item", created["name"], ["category", "is_internal"], as_dict=True
        )
        self.assertEqual(stored.category, "Invoice - Milestone")
        self.assertEqual(stored.is_internal, 1)

    def test_create_defaults_category_and_is_internal(self):
        created = self.create()
        self.assertEqual(created["category"], "Other - Milestone")
        self.assertEqual(created["is_internal"], 0)

    def test_create_rejects_category_of_the_other_type(self):
        with self.assertRaises(frappe.ValidationError):
            self.create(category="Check-in - Touchpoint")

    def test_edit_updates_category_and_is_internal(self):
        name = self.create(category="Contract - Milestone")["name"]
        edited = edit_project_timeline_item(name, category="CSM - Milestone", is_internal=1)
        self.assertEqual(edited["category"], "CSM - Milestone")
        self.assertEqual(edited["is_internal"], 1)

    def test_edit_leaves_omitted_fields_untouched(self):
        name = self.create(category="Delivery - Milestone", is_internal=1)["name"]
        edited = edit_project_timeline_item(name, title="Renamed")
        self.assertEqual(edited["title"], "Renamed")
        self.assertEqual(edited["category"], "Delivery - Milestone")
        self.assertEqual(edited["is_internal"], 1)

    def test_edit_rejects_category_of_the_other_type(self):
        name = self.create()["name"]
        with self.assertRaises(frappe.ValidationError):
            edit_project_timeline_item(name, category="Follow-up - Touchpoint")

    def test_get_returns_category_and_is_internal(self):
        self.create(category="Invoice - Milestone", is_internal=1)
        items = get_project_timeline_items(self.project)["data"]
        self.assertTrue(items)
        for item in items:
            self.assertIn("category", item)
            self.assertIn("is_internal", item)

    def test_get_in_calendar_mode_returns_category_and_is_internal(self):
        self.create(category="Invoice - Milestone", is_internal=1)
        items = get_project_timeline_items(self.project, is_calendar=1)["data"]
        self.assertTrue(items)
        for item in items:
            self.assertIn("category", item)
            self.assertIn("is_internal", item)

    def test_is_internal_is_returned_as_int(self):
        # The FE renders the internal indicator on truthiness, so "0" would show as internal.
        self.create(is_internal="0")
        self.create(is_internal="1")
        for item in get_project_timeline_items(self.project)["data"]:
            self.assertIsInstance(item["is_internal"], int)
