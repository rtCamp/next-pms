from unittest.mock import MagicMock, patch

import frappe

from next_pms.api.audit import trigger_audit_report
from next_pms.tasks.scheduled_audit import trigger_weekly_audits
from next_pms.tests import TestNextPms


class TestAuditReport(TestNextPms):
    @patch("next_pms.api.audit.get_audit_url")
    @patch("next_pms.api.audit.get_api_key")
    @patch("requests.post")
    def test_trigger_audit_report_success(self, mock_post, mock_get_api_key, mock_get_audit_url):
        mock_get_audit_url.return_value = "https://rt-report-automation.rtcamp.com/api/audit/run-all"
        mock_get_api_key.return_value = "test-api-key"
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        res = trigger_audit_report()
        self.assertEqual(res.get("status"), "success")
        mock_post.assert_called_once_with(
            "https://rt-report-automation.rtcamp.com/api/audit/run-all",
            headers={"Content-Type": "application/json", "x-api-key": "test-api-key"},
            timeout=60,
        )

    @patch("next_pms.api.audit.get_audit_url")
    def test_trigger_audit_report_missing_url_throws(self, mock_get_audit_url):
        mock_get_audit_url.return_value = None
        self.assertRaises(frappe.ValidationError, trigger_audit_report)

    @patch("next_pms.tasks.scheduled_audit.trigger_audit_report")
    def test_trigger_weekly_audits_runs_without_error(self, mock_trigger_audit_report):
        trigger_weekly_audits()
        mock_trigger_audit_report.assert_called_once()
