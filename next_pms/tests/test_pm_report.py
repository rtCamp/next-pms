from unittest.mock import patch

import frappe
from requests.models import Response

from next_pms.api.generate_pm_report import generate_pm_report
from next_pms.tests import TestNextPms


class TestPmReport(TestNextPms):
    def setUp(self):
        super().setUp()
        self.project_name = frappe.db.get_value("Project", {"project_name": "Next Pms"}, "name")
        # Ensure report generation is enabled
        frappe.db.set_value("Project", self.project_name, "custom_enable_project_report_generation", 1)
        frappe.db.commit()

        # Login as Manager to have write permission
        self.login_as_user("next-project-manager@example.com")

        # Set a mock API key in Timesheet Settings to satisfy generate_pm_report checks
        settings = frappe.get_doc("Timesheet Settings")
        settings.custom_pm_report_api_key = "mock-api-key"
        settings.save(ignore_permissions=True)
        frappe.db.commit()

    def test_generate_pm_report_api(self):
        mock_resp = Response()
        mock_resp.status_code = 200
        mock_resp._content = b'{"run_ids": ["mock-run-id-123"], "status": "triggered"}'

        with patch("requests.post", return_value=mock_resp):
            response = generate_pm_report(self.project_name, "2026-06-01", "2026-06-15")
            self.assertEqual(response.get("status"), "triggered")

            # Check that the row was added to the child table
            project_doc = frappe.get_doc("Project", self.project_name)
            reports = project_doc.get("custom_project_reports") or []
            self.assertTrue(len(reports) > 0)
            self.assertEqual(reports[-1].run_id, "mock-run-id-123")
            self.assertEqual(reports[-1].status, "Generating")

    def test_generate_pm_report_disabled_project(self):
        # Disable report generation
        frappe.db.set_value("Project", self.project_name, "custom_enable_project_report_generation", 0)
        frappe.db.commit()

        self.assertRaises(
            frappe.ValidationError,
            generate_pm_report,
            self.project_name,
            "2026-06-01",
            "2026-06-15",
        )
