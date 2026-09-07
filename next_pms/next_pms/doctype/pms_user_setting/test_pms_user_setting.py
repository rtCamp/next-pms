# Copyright (c) 2026, rtCamp and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase

from next_pms.next_pms.doctype.pms_user_setting.pms_user_setting import (
    get_pms_settings,
    update_pms_settings,
)
from next_pms.tests.utils import make_employee

# On IntegrationTestCase, the doctype test records and all link-field test record
# dependencies are recursively loaded. "user" links to User, whose own dependency
# chain (Email Account -> Company) pulls in erpnext's global test bootstrap. All
# users this suite needs are created explicitly in setUpClass, so skip the
# auto-generated "User" fixture.
EXTRA_TEST_RECORD_DEPENDENCIES = []
IGNORE_TEST_RECORD_DEPENDENCIES = ["User"]

EMPLOYEE_USER = "pms-user-setting.employee@example.com"
OTHER_USER = "pms-user-setting.other@example.com"


class TestPMSUserSetting(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = frappe.defaults.get_user_default("Company") or frappe.get_all("Company", pluck="name", limit=1)[0]
        cls.employee = make_employee(EMPLOYEE_USER, company=cls.company, leave_approver="Administrator")
        cls.other = make_employee(OTHER_USER, company=cls.company, leave_approver="Administrator")
        frappe.set_user("Administrator")
        frappe.db.set_single_value("Timesheet Settings", "auto_expand_weeks_by_default", 6)

    def setUp(self):
        frappe.set_user("Administrator")
        for user in (EMPLOYEE_USER, OTHER_USER):
            if frappe.db.exists("PMS User Setting", user):
                frappe.delete_doc("PMS User Setting", user, force=True, ignore_permissions=True)
        frappe.set_user(EMPLOYEE_USER)
        self.addCleanup(frappe.set_user, "Administrator")

    def test_get_settings_returns_system_defaults_on_first_call(self):
        self.assertFalse(frappe.db.exists("PMS User Setting", EMPLOYEE_USER))
        settings = get_pms_settings()

        self.assertTrue(frappe.db.exists("PMS User Setting", EMPLOYEE_USER))
        self.assertFalse(settings["auto_expand_weeks_by_default"])
        self.assertEqual(settings["use_system_auto_expand_weeks"], 1)
        self.assertEqual(settings["system_auto_expand_weeks_by_default"], 6)

    def test_update_settings_persists_user_override(self):
        get_pms_settings()
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
        get_pms_settings()
        update_pms_settings({"auto_expand_weeks_by_default": 3})

        frappe.set_user(OTHER_USER)
        self.assertFalse(get_pms_settings()["auto_expand_weeks_by_default"])
