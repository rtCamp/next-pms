import unittest
from unittest.mock import patch

import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, today

from next_pms.tests.resource_management.ai_staffing.utils import STAGE, crm_installed, make_deal

RUN = "next_pms.resource_management.ai_staffing.pipeline.run_staffing"
SYNC = "next_pms.resource_management.ai_staffing.pipeline.sync_project_value"


@unittest.skipUnless(crm_installed(), "CRM is not installed")
class TestCRMDealTrigger(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        if not frappe.db.exists("Sales Stage", STAGE):
            frappe.get_doc({"doctype": "Sales Stage", "stage_name": STAGE}).insert(ignore_permissions=True)

    def setUp(self):
        self.set_enabled(True)
        enqueue = patch("frappe.enqueue")
        self.enqueue = enqueue.start()
        self.addCleanup(enqueue.stop)

    def set_enabled(self, enabled: bool):
        settings = frappe.get_single("AI Staffing Settings")
        settings.enabled = enabled
        settings.start_window_days = 30
        settings.set("qualifying_stages", [{"sales_stage": STAGE}])
        settings.save()

    def queued(self) -> list[str]:
        """AI staffing jobs only; CRM's own hooks enqueue jobs too."""
        methods = [str(c.args[0] if c.args else c.kwargs.get("method")) for c in self.enqueue.call_args_list]
        return [m for m in methods if m in (RUN, SYNC)]

    def qualifying_deal(self, **values) -> str:
        return make_deal(sales_stage=STAGE, custom_expected_start_date=add_days(today(), 10), **values)

    def test_a_qualifying_deal_is_queued_for_staffing(self):
        deal = self.qualifying_deal()

        self.assertEqual(frappe.db.get_value("AI Staffing Request", deal, "status"), "Pending")
        self.assertEqual(self.queued(), [RUN])
        self.assertEqual(self.enqueue.call_args.kwargs["job_id"], f"ai-staffing::run_staffing::{deal}")

    def test_deals_that_do_not_qualify_are_left_alone(self):
        for values in (
            {"sales_stage": "Prospecting", "custom_expected_start_date": add_days(today(), 10)},
            {"sales_stage": STAGE, "custom_expected_start_date": add_days(today(), 31)},
            {"sales_stage": STAGE, "custom_expected_start_date": add_days(today(), -1)},
            {
                "sales_stage": STAGE,
                "custom_expected_start_date": add_days(today(), 10),
                "custom_handover_sheet_link": "",
            },
        ):
            with self.subTest(values=values):
                deal = make_deal(**values)
                self.assertFalse(frappe.db.exists("AI Staffing Request", deal))
        self.assertEqual(self.queued(), [])

    def test_nothing_runs_while_disabled(self):
        self.set_enabled(False)

        deal = self.qualifying_deal()

        self.assertFalse(frappe.db.exists("AI Staffing Request", deal))
        self.assertEqual(self.queued(), [])

    def test_saving_a_failed_deal_retries_it(self):
        deal = self.qualifying_deal()
        frappe.db.set_value("AI Staffing Request", deal, {"status": "Failed", "error": "sheet not shared"})
        self.enqueue.reset_mock()

        frappe.get_doc("CRM Deal", deal).save(ignore_permissions=True)

        request = frappe.db.get_value("AI Staffing Request", deal, ["status", "error"], as_dict=True)
        self.assertEqual((request.status, request.error), ("Pending", None))
        self.assertEqual(self.queued(), [RUN])

    def test_an_allocated_deal_only_syncs_a_changed_value(self):
        deal = self.qualifying_deal()
        frappe.db.set_value("AI Staffing Request", deal, "status", "Allocated")
        self.enqueue.reset_mock()

        doc = frappe.get_doc("CRM Deal", deal)
        doc.save(ignore_permissions=True)
        self.assertEqual(self.queued(), [])

        doc.expected_deal_value = 52000
        doc.save(ignore_permissions=True)
        self.assertEqual(self.queued(), [SYNC])
