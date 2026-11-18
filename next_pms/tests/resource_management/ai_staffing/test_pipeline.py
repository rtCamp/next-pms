import unittest
from unittest.mock import patch

import frappe
from frappe.tests import IntegrationTestCase

from next_pms.resource_management.ai_staffing import data
from next_pms.resource_management.ai_staffing.pipeline import run_staffing, sync_project_value
from next_pms.tests.resource_management.ai_staffing.utils import (
    ORGANIZATION,
    crm_installed,
    make_deal,
    make_staff,
    mocked_sheet,
    sow_tabs,
    transaction_kept_open,
)

TABS = sow_tabs({"Sr CMS Dev": ("8", "1"), "QA Engineer": ("4", "1")})


@unittest.skipUnless(crm_installed(), "CRM is not installed")
class TestAIStaffingPipeline(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.wordpress_senior = make_staff("AIS WordPress Senior", "L5 - Senior Software Engineer", ("WordPress",))
        cls.other_senior = make_staff("AIS Other Senior", "L4 - Senior Software Engineer")
        cls.qa = make_staff("AIS QA", "L3 - Quality Engineer")
        cls.staff = {cls.wordpress_senior, cls.other_senior, cls.qa}
        frappe.db.set_single_value("AI Staffing Settings", "enabled", 1)

    def setUp(self):
        # The class rolls back only once, so earlier tests' bookings would make the staff look busy.
        frappe.db.delete("Resource Allocation", {"employee": ["in", list(self.staff)]})
        load_employees = data.active_employees
        only_test_staff = patch.object(
            data, "active_employees", lambda: [e for e in load_employees() if e.name in self.staff]
        )
        only_test_staff.start()
        self.addCleanup(only_test_staff.stop)

    def staff_deal(self, deal: str, tabs=TABS) -> frappe._dict:
        if not frappe.db.exists("AI Staffing Request", deal):
            frappe.get_doc({"doctype": "AI Staffing Request", "deal": deal, "sow_link": "ai-staffing-test"}).insert(
                ignore_permissions=True
            )
        with transaction_kept_open(), mocked_sheet(tabs):
            run_staffing(deal)
        return frappe.db.get_value("AI Staffing Request", deal, ["status", "project", "error", "summary"], as_dict=True)

    def allocations(self, project: str) -> list[frappe._dict]:
        return frappe.get_all(
            "Resource Allocation",
            filters={"project": project},
            fields=[
                "employee",
                "status",
                "is_ai_created",
                "is_billable",
                "hours_allocated_per_day",
                "ai_allocation_reason",
            ],
        )

    def test_staffs_a_deal_into_a_new_project(self):
        deal = make_deal()

        request = self.staff_deal(deal)

        self.assertEqual(request.status, "Allocated", request.error)
        project = frappe.get_doc("Project", request.project)
        self.assertEqual(project.project_name, f"{ORGANIZATION} - {deal}")
        self.assertEqual(project.custom_deal, deal)
        self.assertEqual(project.estimated_costing, 48000)
        self.assertEqual(project.custom_default_hourly_billing_rate, 100)
        self.assertEqual(frappe.db.get_value("CRM Deal", deal, "custom_project"), project.name)
        self.assertEqual(frappe.db.get_value("Customer", project.customer, "custom_crm_organization"), ORGANIZATION)

        allocations = {a.employee: a for a in self.allocations(project.name)}
        self.assertEqual(set(allocations), {self.wordpress_senior, self.qa})
        senior = allocations[self.wordpress_senior]
        self.assertEqual((senior.status, senior.is_ai_created, senior.is_billable), ("Tentative", 1, 1))
        self.assertTrue(senior.ai_allocation_reason.startswith("Role: Sr CMS Dev\n- L5 - Senior Software Engineer"))
        self.assertNotIn("Margin", senior.ai_allocation_reason)
        self.assertIn("Margin", request.summary)

    def test_an_allocated_deal_is_never_staffed_twice(self):
        deal = make_deal()
        project = self.staff_deal(deal).project

        frappe.db.set_value("AI Staffing Request", deal, "status", "Failed")
        request = self.staff_deal(deal)

        self.assertEqual(request.project, project)
        self.assertEqual(len(self.allocations(project)), 2)
        self.assertEqual(frappe.db.count("Project", {"custom_deal": deal}), 1)

    def test_reuses_the_project_the_won_automation_created(self):
        deal = make_deal()
        customer = frappe.get_doc(
            {"doctype": "Customer", "customer_name": ORGANIZATION, "default_currency": "USD"}
        ).insert(ignore_permissions=True)
        existing = frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": f"Won project {deal}",
                "company": frappe.db.get_value("CRM Deal", deal, "company"),
                "customer": customer.name,
                "custom_deal": deal,
            }
        ).insert(ignore_permissions=True)

        request = self.staff_deal(deal)

        self.assertEqual(request.project, existing.name)
        self.assertEqual(frappe.db.get_value("Project", existing.name, "estimated_costing"), 48000)
        self.assertEqual(len(self.allocations(existing.name)), 2)

    def test_an_unreadable_sheet_fails_the_request_and_creates_nothing(self):
        deal = make_deal()

        request = self.staff_deal(deal, tabs=frappe.ValidationError("Share the sheet with bot@example.com"))

        self.assertEqual(request.status, "Failed")
        self.assertIn("bot@example.com", request.error)
        self.assertFalse(request.project)
        self.assertFalse(frappe.db.exists("Project", {"custom_deal": deal}))

    def test_a_second_deal_does_not_book_hours_the_first_one_holds(self):
        first = self.staff_deal(make_deal()).project
        second = self.staff_deal(make_deal(), tabs=sow_tabs({"Sr CMS Dev": ("8", "1")})).project

        self.assertEqual(
            [a.employee for a in self.allocations(first) if a.hours_allocated_per_day == 8], [self.wordpress_senior]
        )
        self.assertEqual([a.employee for a in self.allocations(second)], [self.other_senior])

    def test_value_sync_follows_the_deal_but_never_blanks_the_project(self):
        deal = make_deal()
        project = self.staff_deal(deal).project

        frappe.db.set_value("CRM Deal", deal, "expected_deal_value", 60000)
        sync_project_value(deal)
        self.assertEqual(frappe.db.get_value("Project", project, "estimated_costing"), 60000)

        frappe.db.set_value("CRM Deal", deal, {"expected_deal_value": 0, "deal_value": 0})
        sync_project_value(deal)
        self.assertEqual(frappe.db.get_value("Project", project, "estimated_costing"), 60000)
