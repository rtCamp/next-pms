import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import add_to_date, get_datetime, today

from next_pms.api.dashboard import _get_time_utilisation, get_time_utilisation

DAYS = 7

ENGINEER = "Time Utilisation Test Engineer"
DESIGNER = "Time Utilisation Test Designer"
IDLE_ROLE = "Time Utilisation Test QA"

UNAUTHORISED_USER = "time-utilisation-unauthorised@example.com"


class TestTimeUtilisation(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()

        for designation in (ENGINEER, DESIGNER, IDLE_ROLE):
            if not frappe.db.exists("Designation", designation):
                frappe.get_doc({"doctype": "Designation", "designation_name": designation}).insert(
                    ignore_permissions=True
                )

        cls.end = get_datetime(today())
        cls.window_start = add_to_date(cls.end, days=-(DAYS - 1))
        cls.before_window = add_to_date(cls.window_start, days=-1)
        cls.after_window = add_to_date(cls.end, days=1)

        # Two engineers share a designation so we can check their hours get added together.
        cls.engineer_1 = cls._make_employee("Engineer One", ENGINEER)
        cls.engineer_2 = cls._make_employee("Engineer Two", ENGINEER)
        cls.designer = cls._make_employee("Designer One", DESIGNER)
        # Has a designation but never logs any time, to check it still shows up with zero hours.
        cls._make_employee("Idle QA", IDLE_ROLE)
        # Has no designation, to check their hours don't show up as a role.
        cls.blank_designation_employee = cls._make_employee("No Designation", designation=None)

        # engineer_1 logs 2h billable and 4h non-billable.
        # engineer_2 logs 1h billable.
        # Both share the ENGINEER designation, so it should total 3h billable and 4h non-billable.
        cls._log_time(cls.engineer_1, cls.window_start, hours=2, is_billable=1)
        cls._log_time(cls.engineer_1, add_to_date(cls.end, hours=23, minutes=59), hours=4, is_billable=0)
        cls._log_time(cls.engineer_2, add_to_date(cls.window_start, days=2), hours=1, is_billable=1)

        # Designer: 3h billable in the window.
        cls._log_time(cls.designer, add_to_date(cls.window_start, days=3), hours=3, is_billable=1)

        # 100h logged a day before the window starts and a day after it ends.
        # These fall outside the range and should never be counted.
        cls._log_time(cls.engineer_1, add_to_date(cls.before_window, hours=23, minutes=59), hours=100, is_billable=1)
        cls._log_time(cls.engineer_1, cls.after_window, hours=100, is_billable=1)

        # 5h logged by the employee with no designation. Should not appear as a role.
        cls._log_time(cls.blank_designation_employee, add_to_date(cls.window_start, days=1), hours=5, is_billable=1)

        # 6h on a rejected timesheet. Should be excluded from the designer's totals.
        cls.rejected_timesheet = cls._log_time(
            cls.designer, add_to_date(cls.window_start, days=1), hours=6, is_billable=1
        )
        frappe.db.set_value("Timesheet", cls.rejected_timesheet, "custom_approval_status", "Rejected")

        frappe.clear_cache()

    @classmethod
    def _make_employee(cls, employee_name, designation):
        employee = frappe.new_doc("Employee")
        employee.update(
            {
                "naming_series": "EMP-",
                "first_name": employee_name,
                "company": cls.company,
                "gender": "Female",
                "date_of_birth": "1990-05-08",
                "date_of_joining": "2013-01-01",
                "status": "Active",
                "employment_type": "Intern",
                # Skips an rtcamp Employee doc-event that errors while deriving
                # leave_approver from reports_to when both are left blank.
                "leave_approver": "Administrator",
            }
        )
        if designation:
            employee.designation = designation
        employee.insert(ignore_permissions=True)
        return employee.name

    @classmethod
    def _log_time(cls, employee, from_time, hours, is_billable):
        timesheet = frappe.get_doc(
            {
                "doctype": "Timesheet",
                "employee": employee,
                "note": "",
                "time_logs": [
                    {
                        "description": "Time utilisation test entry",
                        "from_time": from_time,
                        "to_time": add_to_date(from_time, hours=hours),
                        "hours": hours,
                        "is_billable": is_billable,
                    }
                ],
            }
        )
        timesheet.flags.ignore_validate = True
        timesheet.insert(ignore_permissions=True)
        return timesheet.name

    def setUp(self):
        _get_time_utilisation.clear_cache()
        frappe.set_user("Administrator")

    def tearDown(self):
        frappe.set_user("Administrator")

    def _roles_by_designation(self, days=DAYS, role=None):
        result = _get_time_utilisation(days, role)
        return {r["designation"]: r for r in result["roles"]}

    def test_sums_hours_per_designation_across_employees(self):
        roles = self._roles_by_designation()
        engineer = roles[ENGINEER]
        self.assertEqual(engineer["billable_hours"], 3)
        self.assertEqual(engineer["non_billable_hours"], 4)
        self.assertEqual(engineer["total_hours"], 7)

    def test_designation_with_zero_activity_still_appears(self):
        roles = self._roles_by_designation()
        self.assertIn(IDLE_ROLE, roles)
        self.assertEqual(roles[IDLE_ROLE]["billable_hours"], 0)
        self.assertEqual(roles[IDLE_ROLE]["non_billable_hours"], 0)
        self.assertEqual(roles[IDLE_ROLE]["total_hours"], 0)

    def test_hours_outside_window_are_excluded(self):
        roles = self._roles_by_designation()
        self.assertEqual(roles[ENGINEER]["total_hours"], 7)

    def test_blank_designation_is_not_a_role(self):
        roles = self._roles_by_designation()
        self.assertNotIn("", roles)
        self.assertNotIn(None, roles)

    def test_rejected_timesheet_is_excluded(self):
        roles = self._roles_by_designation()
        # Only the 3h accepted entry should count; the 6h "Rejected" one must not.
        self.assertEqual(roles[DESIGNER]["billable_hours"], 3)
        self.assertEqual(roles[DESIGNER]["total_hours"], 3)

    def test_role_filter_only_aggregates_hours_for_that_designation(self):
        roles = self._roles_by_designation(role=DESIGNER)
        self.assertEqual(roles[DESIGNER]["billable_hours"], 3)
        self.assertEqual(roles[DESIGNER]["total_hours"], 3)
        self.assertEqual(roles[ENGINEER]["total_hours"], 0)

    def test_days_below_one_is_rejected(self):
        with self.assertRaises(frappe.ValidationError):
            get_time_utilisation(days=0)

    def test_unauthorised_user_is_denied(self):
        if not frappe.db.exists("User", UNAUTHORISED_USER):
            frappe.get_doc(
                {
                    "doctype": "User",
                    "email": UNAUTHORISED_USER,
                    "first_name": "Unauthorised",
                    "user_type": "System User",
                    "send_welcome_email": 0,
                }
            ).insert(ignore_permissions=True)
        frappe.set_user(UNAUTHORISED_USER)
        with self.assertRaises(frappe.PermissionError):
            get_time_utilisation(days=DAYS)
