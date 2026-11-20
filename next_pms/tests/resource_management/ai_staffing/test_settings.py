from unittest.mock import patch

import frappe
from frappe.tests import IntegrationTestCase

from next_pms.resource_management.doctype.ai_staffing_settings import ai_staffing_settings


class TestAIStaffingSettings(IntegrationTestCase):
    def test_cannot_be_enabled_without_frappe_crm_xt(self):
        settings = frappe.get_single("AI Staffing Settings")
        settings.enabled = 1

        with patch.object(ai_staffing_settings, "crm_xt_installed", return_value=False):
            self.assertRaisesRegex(frappe.ValidationError, "frappe_crm_xt", settings.save)

    def test_can_be_disabled_without_frappe_crm_xt(self):
        settings = frappe.get_single("AI Staffing Settings")
        settings.enabled = 0

        with patch.object(ai_staffing_settings, "crm_xt_installed", return_value=False):
            settings.save()
