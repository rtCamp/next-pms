from unittest.mock import MagicMock, patch

import frappe
from requests.models import Response

from next_pms.api.generate_pm_report import (
    generate_pm_report,
    get_repository_project_boards,
    resync_report,
)
from next_pms.tests import TestNextPms


class TestPmReport(TestNextPms):
    def setUp(self):
        super().setUp()

        # Bypass link validation to prevent failures on missing DocTypes (e.g. Slack Channel) in CI
        self.link_patcher = patch("frappe.model.base_document.BaseDocument.get_invalid_links", return_value=([], []))
        self.link_patcher.start()

        self.project_name = frappe.db.get_value("Project", {"project_name": "Next Pms"}, "name")
        # Ensure report generation is enabled, slack channel slug is set, and a valid drive link is present
        frappe.db.set_value(
            "Project",
            self.project_name,
            {
                "custom_enable_project_report_generation": 1,
                "custom_slack_channel_slug": "test-channel",
                "custom_project_drive_link": "https://docs.google.com/test-drive-link",
            },
        )
        frappe.db.commit()

        # Login as Manager to have write permission
        self.login_as_user("next-project-manager@example.com")

        # Set a mock API key in Timesheet Settings to satisfy generate_pm_report checks
        settings = frappe.get_doc("Timesheet Settings")
        settings.pm_report_api_key = "mock-api-key"
        settings.save(ignore_permissions=True)
        frappe.db.commit()

        # Mock LLM URLs in site config for testing
        self.old_summarize_url = frappe.conf.get("llm_summarize_url")
        self.old_status_url = frappe.conf.get("llm_status_url")
        frappe.conf.llm_summarize_url = "https://mock-summarize-url"
        frappe.conf.llm_status_url = "https://mock-status-url"

    def tearDown(self):
        super().tearDown()
        if hasattr(self, "link_patcher"):
            self.link_patcher.stop()
        if hasattr(self, "old_summarize_url"):
            frappe.conf.llm_summarize_url = self.old_summarize_url
        if hasattr(self, "old_status_url"):
            frappe.conf.llm_status_url = self.old_status_url

    # ------------------------------------------------------------------ #
    # generate_pm_report — happy path
    # ------------------------------------------------------------------ #

    def test_generate_pm_report_api(self):
        mock_resp = Response()
        mock_resp.status_code = 200
        mock_resp._content = b'{"run_ids": ["mock-run-id-123"], "status": "triggered"}'

        with patch("requests.post", return_value=mock_resp):
            response = generate_pm_report(self.project_name, "2026-06-01", "2026-06-15")
            self.assertEqual(response.get("status"), "triggered")

            # Check that the row was added to the child table (direct DB query to bypass session cache)
            status, run_id = frappe.db.get_value(
                "Project Report",
                {"parent": self.project_name, "run_id": "mock-run-id-123"},
                ["status", "run_id"],
            )
            self.assertEqual(run_id, "mock-run-id-123")
            self.assertEqual(status, "Generating")

    # ------------------------------------------------------------------ #
    # generate_pm_report — validation guards
    # ------------------------------------------------------------------ #

    def test_generate_pm_report_disabled_project(self):
        frappe.db.set_value("Project", self.project_name, "custom_enable_project_report_generation", 0)
        frappe.db.commit()

        self.assertRaises(
            frappe.ValidationError,
            generate_pm_report,
            self.project_name,
            "2026-06-01",
            "2026-06-15",
        )

    def test_generate_pm_report_missing_slack_slug(self):
        frappe.db.set_value("Project", self.project_name, "custom_slack_channel_slug", "")
        frappe.db.commit()

        self.assertRaises(
            frappe.ValidationError,
            generate_pm_report,
            self.project_name,
            "2026-06-01",
            "2026-06-15",
        )

    def test_generate_pm_report_missing_dates(self):
        self.assertRaises(
            frappe.ValidationError,
            generate_pm_report,
            self.project_name,
            None,
            None,
        )

    def test_generate_pm_report_invalid_date_range(self):
        self.assertRaises(
            frappe.ValidationError,
            generate_pm_report,
            self.project_name,
            "2026-06-15",  # from_date after to_date
            "2026-06-01",
        )

    def test_generate_pm_report_missing_drive_link(self):
        frappe.db.set_value("Project", self.project_name, "custom_project_drive_link", "")
        frappe.db.commit()

        self.assertRaises(
            frappe.ValidationError,
            generate_pm_report,
            self.project_name,
            "2026-06-01",
            "2026-06-15",
        )

    def test_generate_pm_report_no_run_id_returned(self):
        """API returns empty run_ids — should raise ValidationError"""
        mock_resp = Response()
        mock_resp.status_code = 200
        mock_resp._content = b'{"run_ids": [], "status": "triggered"}'

        with patch("requests.post", return_value=mock_resp):
            self.assertRaises(
                frappe.ValidationError,
                generate_pm_report,
                self.project_name,
                "2026-06-01",
                "2026-06-15",
            )

    # ------------------------------------------------------------------ #
    # resync_report
    # ------------------------------------------------------------------ #

    def test_resync_report_api(self):
        # Insert a matching report row with Completed status
        project_doc = frappe.get_doc("Project", self.project_name)
        project_doc.append(
            "custom_project_reports",
            {
                "run_id": "test-run-id-999",
                "date_range": "2026-06-01 to 2026-06-15",
                "status": "Completed",
            },
        )
        project_doc.save()
        frappe.db.commit()

        mock_resp = Response()
        mock_resp.status_code = 200
        mock_resp._content = (
            b'{"data": [{"status": "Completed", "output": {"document_url": "https://docs.google.com/test-document"}}]}'
        )

        # Patch update_report_row to verify it is called with the correct arguments
        # without relying on DB state (which is affected by Frappe's session document cache)
        with (
            patch("requests.get", return_value=mock_resp),
            patch("next_pms.api.generate_pm_report.update_report_row") as mock_update,
        ):
            res = resync_report(self.project_name, "test-run-id-999")
            self.assertEqual(res.get("status"), "success")
            self.assertEqual(res.get("document_url"), "https://docs.google.com/test-document")

            # Verify update_report_row was called with the correct status and document link
            mock_update.assert_called_once()
            call_kwargs = mock_update.call_args.kwargs
            self.assertEqual(call_kwargs.get("project"), self.project_name)
            self.assertEqual(call_kwargs.get("run_id"), "test-run-id-999")
            self.assertEqual(call_kwargs.get("report_link"), "https://docs.google.com/test-document")
            self.assertEqual(call_kwargs.get("status"), "Done")

    def test_resync_report_invalid_run_id(self):
        """Resyncing with a non-existent run ID should raise ValidationError"""
        self.assertRaises(
            frappe.ValidationError,
            resync_report,
            self.project_name,
            "non-existent-run-id",
        )

    # ------------------------------------------------------------------ #
    # get_repository_project_boards
    # ------------------------------------------------------------------ #

    def test_get_repository_project_boards(self):
        # Test with empty repository
        self.assertEqual(get_repository_project_boards(None), [])

        # Mock document in memory using MagicMock to avoid looking up non-existent GitHub Repository DocType in CI
        mock_repo = MagicMock()
        mock_repo.get.return_value = [MagicMock(board_name="Board A"), MagicMock(board_name="Board B")]

        with patch("frappe.get_doc", return_value=mock_repo):
            res = get_repository_project_boards("mock-repo")
            self.assertEqual(res, ["Board A", "Board B"])
