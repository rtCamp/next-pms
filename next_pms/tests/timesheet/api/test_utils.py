import frappe
from erpnext import get_default_company
from frappe.permissions import add_user_permission
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, get_first_day_of_week, get_last_day_of_week, nowdate

from next_pms.tests.utils import make_employee
from next_pms.timesheet.api.employee import get_employee_list
from next_pms.timesheet.api.project import get_employee_project_ids, get_project_employee_access
from next_pms.timesheet.api.timesheet import submit_for_approval
from next_pms.timesheet.api.utils import (
    can_approve_project_timesheets,
    can_approve_week,
    employee_has_higher_access,
    get_timesheet_approver_users,
)
from next_pms.timesheet.permission import get_permission_query_conditions, has_permission

MANAGER_USER = "ts-utils-projects-manager@example.com"
REVIEWER_USER = "ts-utils-projects-user@example.com"
ADMIN_USER = "ts-utils-system-manager@example.com"
PLAIN_EMPLOYEE_USER = "ts-utils-plain-employee@example.com"
REPORT_USER = "ts-utils-report@example.com"
OTHER_EMPLOYEE_USER = "ts-utils-other-employee@example.com"
MANAGED_PROJECT_NAME = "Timesheet Utils Managed Project"
OTHER_PROJECT_NAME = "Timesheet Utils Other Project"
APPROVER_PROJECT_NAME = "Timesheet Utils Approver Project"


class TestTimesheetAccess(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        company = get_default_company()
        make_employee(MANAGER_USER, company=company, leave_approver="Administrator")
        make_employee(ADMIN_USER, company=company, leave_approver="Administrator")
        make_employee(PLAIN_EMPLOYEE_USER, company=company, leave_approver="Administrator")
        reviewer = make_employee(REVIEWER_USER, company=company, leave_approver="Administrator")
        cls.report = make_employee(REPORT_USER, company=company, leave_approver="Administrator")
        cls.other_employee = make_employee(OTHER_EMPLOYEE_USER, company=company, leave_approver="Administrator")
        frappe.db.set_value("Employee", cls.report, "reports_to", reviewer)
        frappe.db.set_value("Employee", cls.other_employee, "reports_to", None)

        frappe.get_doc("User", MANAGER_USER).add_roles("Projects Manager")
        frappe.get_doc("User", REVIEWER_USER).add_roles("Projects User")
        frappe.get_doc("User", ADMIN_USER).add_roles("System Manager")

        cls.managed_project = cls._project(MANAGED_PROJECT_NAME, company)
        cls.other_project = cls._project(OTHER_PROJECT_NAME, company)
        cls.approver_project = cls._project(APPROVER_PROJECT_NAME, company)
        cls.company = company
        frappe.db.set_value(
            "Project",
            cls.managed_project,
            {"custom_engineering_manager": REVIEWER_USER, "custom_project_manager": None},
        )
        frappe.db.set_value(
            "Project",
            cls.other_project,
            {"custom_engineering_manager": None, "custom_project_manager": REVIEWER_USER},
        )
        frappe.db.set_value(
            "Project",
            cls.approver_project,
            {"custom_engineering_manager": PLAIN_EMPLOYEE_USER, "custom_project_manager": MANAGER_USER},
        )

    @staticmethod
    def _project(name, company):
        return frappe.db.get_value("Project", {"project_name": name}) or (
            frappe.get_doc(
                {
                    "doctype": "Project",
                    "project_name": name,
                    "company": company,
                    "custom_billing_type": "Non-Billable",
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    def tearDown(self):
        frappe.set_user("Administrator")

    def test_only_system_manager_writes_someone_elses_time(self):
        frappe.set_user(MANAGER_USER)
        self.assertFalse(employee_has_higher_access(self.other_employee, ptype="write"))
        frappe.set_user(REVIEWER_USER)
        self.assertFalse(employee_has_higher_access(self.report, ptype="write"))
        frappe.set_user(ADMIN_USER)
        self.assertTrue(employee_has_higher_access(self.other_employee, ptype="write"))

    def test_projects_manager_reads_and_approves_everyone(self):
        frappe.set_user(MANAGER_USER)
        self.assertTrue(employee_has_higher_access(self.other_employee, ptype="read"))
        self.assertTrue(can_approve_week(self.other_employee))
        self.assertTrue(can_approve_project_timesheets(self.other_project, self.other_employee))

    def test_projects_user_is_limited_to_reports_and_own_projects(self):
        frappe.set_user(REVIEWER_USER)
        self.assertTrue(employee_has_higher_access(self.report, ptype="read"))
        self.assertFalse(employee_has_higher_access(self.other_employee, ptype="read"))
        self.assertTrue(can_approve_week(self.report))
        self.assertFalse(can_approve_week(self.other_employee))
        self.assertTrue(can_approve_project_timesheets(self.managed_project, self.other_employee))
        self.assertFalse(can_approve_project_timesheets(self.other_project, self.other_employee))

    def test_plain_employee_cannot_write_or_approve_another_employees_time(self):
        frappe.set_user(PLAIN_EMPLOYEE_USER)
        self.assertFalse(employee_has_higher_access(self.other_employee, ptype="write"))
        self.assertFalse(employee_has_higher_access(self.other_employee, ptype="read"))
        self.assertFalse(can_approve_week(self.other_employee))
        self.assertFalse(can_approve_project_timesheets(self.other_project, self.other_employee))

    def test_projects_user_looks_up_project_membership_of_any_employee(self):
        frappe.set_user(REVIEWER_USER)
        self.assertIsInstance(get_employee_project_ids(self.other_employee), list)
        self.assertIn("is_valid", get_project_employee_access(employee=self.other_employee))

    def test_plain_employee_cannot_look_up_another_employees_project_membership(self):
        frappe.set_user(PLAIN_EMPLOYEE_USER)
        with self.assertRaises(frappe.PermissionError):
            get_employee_project_ids(self.other_employee)
        with self.assertRaises(frappe.PermissionError):
            get_project_employee_access(employee=self.other_employee)

    def _picker_as(self, user, **kwargs):
        """Employee names the picker returns to `user`, who is limited to their own
        Employee record the way HRMS limits every user."""
        add_user_permission("Employee", frappe.db.get_value("Employee", {"user_id": user}), user, True)
        frappe.set_user(user)
        return [row.name for row in get_employee_list(**kwargs)["data"]]

    def test_employee_picker_lists_the_directory_for_projects_user(self):
        self.assertEqual(self._picker_as(REVIEWER_USER, employee_name=OTHER_EMPLOYEE_USER), [self.other_employee])

    def test_employee_picker_role_filter_works_for_projects_user(self):
        manager = frappe.db.get_value("Employee", {"user_id": MANAGER_USER})
        picked = self._picker_as(REVIEWER_USER, employee_name=MANAGER_USER, roles=["Projects Manager"])
        self.assertEqual(picked, [manager])

    def test_employee_picker_stays_limited_for_plain_employee(self):
        self.assertEqual(self._picker_as(PLAIN_EMPLOYEE_USER, employee_name=OTHER_EMPLOYEE_USER), [])

    def _log_week(self, employee, project, start_date):
        week_start = get_first_day_of_week(start_date)
        frappe.get_doc(
            {
                "doctype": "Timesheet",
                "name": frappe.generate_hash(length=10),
                "employee": employee,
                "company": self.company,
                "parent_project": project,
                "start_date": week_start,
                "end_date": get_last_day_of_week(week_start),
            }
        ).db_insert()

    def setUp(self):
        frappe.db.delete("Timesheet", {"employee": ["in", [self.report, self.other_employee]]})

    def test_approver_list_offers_only_the_reporting_manager_without_project_time(self):
        self.assertEqual(get_timesheet_approver_users(self.report, nowdate()), {REVIEWER_USER})
        self.assertEqual(get_timesheet_approver_users(self.other_employee, nowdate()), set())

    def test_approver_list_offers_managers_of_the_weeks_projects_who_hold_the_role(self):
        self._log_week(self.other_employee, self.managed_project, nowdate())
        self._log_week(self.other_employee, self.approver_project, nowdate())
        self._log_week(self.other_employee, self.other_project, nowdate())

        self.assertEqual(get_timesheet_approver_users(self.other_employee, nowdate()), {REVIEWER_USER, MANAGER_USER})

    def test_approver_list_ignores_projects_from_other_weeks(self):
        self._log_week(self.other_employee, self.approver_project, add_days(nowdate(), -7))
        self.assertNotIn(MANAGER_USER, get_timesheet_approver_users(self.other_employee, nowdate()))

    def test_approver_list_never_offers_the_employee_themselves(self):
        reviewer = frappe.db.get_value("Employee", {"user_id": REVIEWER_USER})
        frappe.db.delete("Timesheet", {"employee": reviewer})
        self._log_week(reviewer, self.managed_project, nowdate())
        self.assertNotIn(REVIEWER_USER, get_timesheet_approver_users(reviewer, nowdate()))

    def test_submit_rejects_an_approver_outside_the_list(self):
        admin_employee = frappe.db.get_value("Employee", {"user_id": ADMIN_USER})
        frappe.set_user(OTHER_EMPLOYEE_USER)
        with self.assertRaises(frappe.PermissionError):
            submit_for_approval(start_date=nowdate(), approver=admin_employee)

    def _timesheet(self, employee, project=None):
        return frappe._dict(doctype="Timesheet", employee=employee, parent_project=project)

    def test_desk_projects_user_reads_reports_and_own_project_timesheets_only(self):
        self.assertTrue(has_permission(self._timesheet(self.report), "read", REVIEWER_USER))
        self.assertTrue(
            has_permission(self._timesheet(self.other_employee, self.managed_project), "read", REVIEWER_USER)
        )
        self.assertFalse(
            has_permission(self._timesheet(self.other_employee, self.other_project), "read", REVIEWER_USER)
        )

        conditions = get_permission_query_conditions(REVIEWER_USER)
        self.assertIn(self.report, conditions)
        self.assertIn(self.managed_project, conditions)
        self.assertNotIn(self.other_employee, conditions)

    def test_desk_writes_on_someone_elses_timesheet_need_system_manager(self):
        self.assertFalse(has_permission(self._timesheet(self.report), "write", REVIEWER_USER))
        self.assertFalse(has_permission(self._timesheet(self.other_employee), "submit", MANAGER_USER))
        self.assertTrue(has_permission(self._timesheet(self.other_employee), "write", ADMIN_USER))

    def test_desk_hr_manager_reads_every_timesheet(self):
        hr_manager = "ts-utils-hr-manager@example.com"
        if not frappe.db.exists("User", hr_manager):
            frappe.get_doc({"doctype": "User", "email": hr_manager, "first_name": "HR Manager"}).insert(
                ignore_permissions=True
            )
        frappe.get_doc("User", hr_manager).add_roles("HR Manager")
        self.assertTrue(has_permission(self._timesheet(self.other_employee), "read", hr_manager))
        self.assertEqual(get_permission_query_conditions(hr_manager), "")

    def test_desk_employee_reads_only_own_timesheets(self):
        own = frappe.db.get_value("Employee", {"user_id": PLAIN_EMPLOYEE_USER})
        self.assertTrue(has_permission(self._timesheet(own), "read", PLAIN_EMPLOYEE_USER))
        self.assertTrue(has_permission(self._timesheet(own), "write", PLAIN_EMPLOYEE_USER))
        self.assertFalse(has_permission(self._timesheet(self.other_employee), "read", PLAIN_EMPLOYEE_USER))
        self.assertEqual(get_permission_query_conditions(MANAGER_USER), "")
