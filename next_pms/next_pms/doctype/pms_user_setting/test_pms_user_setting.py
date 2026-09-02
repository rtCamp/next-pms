# Copyright (c) 2026, rtCamp and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase

from next_pms.next_pms.doctype.pms_user_setting.pms_user_setting import (
    get_pms_settings,
    update_pms_settings,
)
from next_pms.tests.utils import make_employee

EMPLOYEE_USER = "pms-user-setting.employee@example.com"
OTHER_USER = "pms-user-setting.other@example.com"


class TestPMSUserSetting(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = frappe.defaults.get_user_default("Company") or frappe.get_all("Company", pluck="name", limit=1)[0]
        cls.employee = make_employee(EMPLOYEE_USER, company=cls.company)
        cls.other = make_employee(OTHER_USER, company=cls.company)
        frappe.set_user("Administrator")
        frappe.db.set_single_value("Timesheet Settings", "auto_expand_weeks_by_default", 6)

    def setUp(self):
        frappe.set_user(EMPLOYEE_USER)
        self.addCleanup(frappe.set_user, "Administrator")

    def test_get_settings_returns_system_defaults_on_first_call(self):
        settings = get_pms_settings()

        self.assertIsNone(settings["auto_expand_weeks_by_default"])
        self.assertEqual(settings["use_system_auto_expand_weeks"], 1)
        self.assertEqual(settings["system_auto_expand_weeks_by_default"], 6)

    def test_update_settings_persists_user_override(self):
        settings = update_pms_settings(
            {
                "auto_expand_weeks_by_default": 3,
                "use_system_auto_expand_weeks": 0,
            }
        )

        self.assertEqual(settings["auto_expand_weeks_by_default"], 3)
        self.assertEqual(settings["use_system_auto_expand_weeks"], 0)
        self.assertEqual(get_pms_settings()["auto_expand_weeks_by_default"], 3)

    def test_update_settings_throws_on_unknown_setting(self):
        get_pms_settings()

        with self.assertRaises(frappe.ValidationError):
            update_pms_settings({"not_a_setting": 1})

    def test_settings_are_scoped_to_the_current_user(self):
        update_pms_settings({"auto_expand_weeks_by_default": 3})

        frappe.set_user(OTHER_USER)
        self.assertIsNone(get_pms_settings()["auto_expand_weeks_by_default"])
