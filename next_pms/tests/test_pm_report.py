from unittest.mock import MagicMock, patch

import frappe
from requests.models import Response

from next_pms.api.generate_pm_report import (
    generate_pm_report,
    get_hours_breakdown,
    get_repository_project_boards,
    resync_report,
)
from next_pms.tests import TestNextPms


class TestPmReport(TestNextPms):
    def setUp(self):
        super().setUp()

        self.test_timesheets = []
        self.test_tasks = []

        # Bypass link validation to prevent failures on missing DocTypes (e.g. Slack Channel) in CI
        self.link_patcher = patch("frappe.model.base_document.BaseDocument.get_invalid_links", return_value=([], []))
        self.link_patcher.start()

        self.project_name = frappe.db.get_value("Project", {"project_name": "Next Pms"}, "name")
        self._original_project_fields = frappe.db.get_value(
            "Project",
            self.project_name,
            [
                "custom_enable_project_report_generation",
                "custom_slack_channel_slug",
                "custom_project_drive_link",
            ],
            as_dict=True,
        )
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
        for ts_name in getattr(self, "test_timesheets", []):
            if frappe.db.exists("Timesheet", ts_name):
                doc = frappe.get_doc("Timesheet", ts_name)
                if doc.docstatus == 1:
                    doc.cancel()
                frappe.delete_doc("Timesheet", ts_name, force=True, ignore_permissions=True)
        for task_name in getattr(self, "test_tasks", []):
            if frappe.db.exists("Task", task_name):
                frappe.delete_doc("Task", task_name, force=True, ignore_permissions=True)
        frappe.db.commit()

        if getattr(self, "project_name", None) and getattr(self, "_original_project_fields", None):
            frappe.db.set_value("Project", self.project_name, self._original_project_fields)
            frappe.db.commit()
        if hasattr(self, "link_patcher"):
            self.link_patcher.stop()
        if hasattr(self, "old_summarize_url"):
            frappe.conf.llm_summarize_url = self.old_summarize_url
        if hasattr(self, "old_status_url"):
            frappe.conf.llm_status_url = self.old_status_url
        super().tearDown()

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

        with (
            patch("frappe.has_permission"),
            patch("frappe.get_doc", return_value=mock_repo),
        ):
            res = get_repository_project_boards("mock-repo")
            self.assertEqual(res, ["Board A", "Board B"])

    # ------------------------------------------------------------------ #
    # get_hours_breakdown — Billable Hours Only (Issue #183)
    # ------------------------------------------------------------------ #

    def _create_test_timesheet(self, time_logs):
        employee = frappe.db.get_value("Employee", {"user_id": "next-employee@example.com"}, "name")
        for log in time_logs:
            if not log.get("description"):
                log["description"] = "Test timesheet description"
        ts = frappe.get_doc(
            {
                "doctype": "Timesheet",
                "employee": employee,
                "note": "Test PM Report Timesheet",
                "time_logs": time_logs,
            }
        )
        ts.flags.ignore_validate = True
        ts.insert(ignore_permissions=True)
        self.test_timesheets.append(ts.name)
        return ts

    def test_get_hours_breakdown_only_billable_hours(self):
        """Verify that get_hours_breakdown returns only billable hours and excludes non-billable entries"""
        # Create a billable task
        billable_task = frappe.get_doc(
            {
                "doctype": "Task",
                "subject": "Billable Task Alpha",
                "project": self.project_name,
                "custom_is_billable": 1,
            }
        ).insert(ignore_permissions=True)
        self.test_tasks.append(billable_task.name)

        # Create a non-billable task
        non_billable_task = frappe.get_doc(
            {
                "doctype": "Task",
                "subject": "Non-Billable Internal Sync",
                "project": self.project_name,
                "custom_is_billable": 0,
            }
        ).insert(ignore_permissions=True)
        self.test_tasks.append(non_billable_task.name)

        # Log timesheet with:
        # 1. Billable log in range (5.0 hrs)
        # 2. Billable log in range (3.0 hrs)
        # 3. Non-billable log in range (4.0 hrs) -> must be excluded
        # 4. Billable log outside range (2.0 hrs) -> must be excluded
        self._create_test_timesheet(
            [
                {
                    "task": billable_task.name,
                    "project": self.project_name,
                    "hours": 5.0,
                    "from_time": "2026-06-05 09:00:00",
                    "to_time": "2026-06-05 14:00:00",
                    "is_billable": 1,
                },
                {
                    "task": billable_task.name,
                    "project": self.project_name,
                    "hours": 3.0,
                    "from_time": "2026-06-06 09:00:00",
                    "to_time": "2026-06-06 12:00:00",
                    "is_billable": 1,
                },
                {
                    "task": non_billable_task.name,
                    "project": self.project_name,
                    "hours": 4.0,
                    "from_time": "2026-06-05 14:00:00",
                    "to_time": "2026-06-05 18:00:00",
                    "is_billable": 0,
                },
                {
                    "task": billable_task.name,
                    "project": self.project_name,
                    "hours": 2.0,
                    "from_time": "2026-05-20 09:00:00",
                    "to_time": "2026-05-20 11:00:00",
                    "is_billable": 1,
                },
            ]
        )

        breakdown = get_hours_breakdown(self.project_name, "2026-06-01", "2026-06-15")

        # Expect only 1 entry: Billable Task Alpha with 8.0 hours (5.0 + 3.0)
        self.assertEqual(len(breakdown), 1)
        self.assertEqual(breakdown[0]["task_title"], "Billable Task Alpha")
        self.assertEqual(breakdown[0]["hours_consumed"], 8.0)

    def test_get_hours_breakdown_excludes_task_marked_non_billable(self):
        """Verify that tasks marked custom_is_billable=0 on Task doctype are excluded even if Timesheet Detail has is_billable=1"""
        task = frappe.get_doc(
            {
                "doctype": "Task",
                "subject": "Changed To Non-Billable Task",
                "project": self.project_name,
                "custom_is_billable": 0,
            }
        ).insert(ignore_permissions=True)
        self.test_tasks.append(task.name)

        self._create_test_timesheet(
            [
                {
                    "task": task.name,
                    "project": self.project_name,
                    "hours": 3.0,
                    "from_time": "2026-06-05 09:00:00",
                    "to_time": "2026-06-05 12:00:00",
                    "is_billable": 1,
                }
            ]
        )

        breakdown = get_hours_breakdown(self.project_name, "2026-06-01", "2026-06-15")
        self.assertEqual(breakdown, [])

    def test_get_hours_breakdown_empty(self):
        """Verify get_hours_breakdown returns empty list when no timesheets exist in range"""
        breakdown = get_hours_breakdown(self.project_name, "2026-01-01", "2026-01-05")
        self.assertEqual(breakdown, [])

    def test_generate_pm_report_payload_contains_only_billable_hours(self):
        """Verify that generate_pm_report passes the billable hours breakdown into the LLM payload"""
        billable_task = frappe.get_doc(
            {
                "doctype": "Task",
                "subject": "Billable Task Beta",
                "project": self.project_name,
                "custom_is_billable": 1,
            }
        ).insert(ignore_permissions=True)
        self.test_tasks.append(billable_task.name)

        non_billable_task = frappe.get_doc(
            {
                "doctype": "Task",
                "subject": "Non-Billable Internal Retro",
                "project": self.project_name,
                "custom_is_billable": 0,
            }
        ).insert(ignore_permissions=True)
        self.test_tasks.append(non_billable_task.name)

        self._create_test_timesheet(
            [
                {
                    "task": billable_task.name,
                    "project": self.project_name,
                    "hours": 6.5,
                    "from_time": "2026-06-05 09:00:00",
                    "to_time": "2026-06-05 15:30:00",
                    "is_billable": 1,
                },
                {
                    "task": non_billable_task.name,
                    "project": self.project_name,
                    "hours": 3.0,
                    "from_time": "2026-06-05 15:30:00",
                    "to_time": "2026-06-05 18:30:00",
                    "is_billable": 0,
                },
            ]
        )

        mock_resp = Response()
        mock_resp.status_code = 200
        mock_resp._content = b'{"run_ids": ["mock-run-id-456"], "status": "triggered"}'

        with patch("requests.post", return_value=mock_resp) as mock_post:
            generate_pm_report(self.project_name, "2026-06-01", "2026-06-15")

            mock_post.assert_called_once()
            call_kwargs = mock_post.call_args.kwargs
            import json

            payload = json.loads(call_kwargs.get("data"))
            hours_breakdown = payload.get("hours_breakdown", [])

            self.assertEqual(len(hours_breakdown), 1)
            self.assertEqual(hours_breakdown[0]["task_title"], "Billable Task Beta")
            self.assertEqual(hours_breakdown[0]["hours_consumed"], 6.5)
