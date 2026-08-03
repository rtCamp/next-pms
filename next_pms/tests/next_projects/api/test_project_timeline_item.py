import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, nowdate

from next_pms.next_projects.api.project_timeline_item import get_project_timeline_items


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
