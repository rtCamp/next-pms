import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, getdate, today

from next_pms.tests.utils import make_holiday_list
from next_pms.timesheet.doc_events.timesheet import get_backdate_restriction_boundary, validate_dates

MANAGER_ROLE = "Projects Manager"

EMPLOYEE_USER = "backdate.employee@example.com"
MANAGER_USER = "backdate.manager@example.com"
PLAIN_VIEWER_USER = "backdate.plainviewer@example.com"
MANAGER_WITHOUT_EMPLOYEE_USER = "backdate.manager.noemployee@example.com"

EMPLOYEE_NAME = "Backdate Test Employee"
MANAGER_EMPLOYEE_NAME = "Backdate Test Manager"
PLAIN_VIEWER_EMPLOYEE_NAME = "Backdate Test Plain Viewer"

COMPANY_HOLIDAY_LIST_NAME = "Backdate Test Company Holidays"
EMPLOYEE_HOLIDAY_LIST_NAME = "Backdate Test Employee Holidays"
LEAVE_TYPE_NAME = "Backdate Test LWP"

EMPLOYEE_ALLOWED_DAYS = 3
MANAGER_ALLOWED_DAYS = 5


class _BackdateRestrictionBase(IntegrationTestCase):
    """Shared fixtures for get_backdate_restriction_boundary / validate_dates.

    All dates are relative to `today()` at test-run time, since the boundary
    calculation is anchored on "today" - unlike most other fixtures in this
    suite, hardcoded calendar dates would not be meaningful here.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.today = getdate(today())

        cls._ensure_company_holiday_list_assignment()

        # Users must exist before an Employee can link to them via user_id.
        cls._make_user(EMPLOYEE_USER, roles=[])
        cls._make_user(MANAGER_USER, roles=[MANAGER_ROLE])
        cls._make_user(PLAIN_VIEWER_USER, roles=[])
        # Deliberately no Employee record for this one - exercises the
        # viewer_employee-is-None branch without also being Administrator (who is
        # exempt from backdate validation entirely, so wouldn't exercise that branch).
        cls._make_user(MANAGER_WITHOUT_EMPLOYEE_USER, roles=[MANAGER_ROLE])

        cls.employee = cls._make_employee(EMPLOYEE_NAME, EMPLOYEE_USER)
        cls.manager_employee = cls._make_employee(MANAGER_EMPLOYEE_NAME, MANAGER_USER)
        cls.plain_viewer_employee = cls._make_employee(PLAIN_VIEWER_EMPLOYEE_NAME, PLAIN_VIEWER_USER)

        # This is a shared dev database that may already carry real holidays/weekly-offs
        # for the default company (from unrelated manual testing). Give each of our
        # employees their own empty holiday list so "no holidays nearby" is actually
        # true for boundary-math assertions, regardless of ambient company data -
        # an employee-level assignment takes priority over the company-level one.
        for employee in (cls.employee, cls.manager_employee, cls.plain_viewer_employee):
            cls._assign_employee_holiday_list(employee, [])

        cls._set_timesheet_settings(
            allow_backdated_entries=1,
            allow_future_entries=0,
            allow_backdated_entries_till_employee=EMPLOYEE_ALLOWED_DAYS,
            allow_backdated_entries_till_manager=MANAGER_ALLOWED_DAYS,
        )
        frappe.clear_cache()

    # -- fixture factories -------------------------------------------------

    @classmethod
    def _make_user(cls, email, roles):
        if not frappe.db.exists("User", email):
            frappe.get_doc(
                {
                    "doctype": "User",
                    "email": email,
                    "first_name": email.split("@")[0],
                    "user_type": "System User",
                    "send_welcome_email": 0,
                }
            ).insert(ignore_permissions=True)
        user = frappe.get_doc("User", email)
        for role in roles:
            user.add_roles(role)
        return email

    @classmethod
    def _make_employee(cls, name, user_id):
        existing = frappe.db.get_value("Employee", {"user_id": user_id})
        if existing:
            return existing
        employee = frappe.new_doc("Employee")
        employee.update(
            {
                "naming_series": "EMP-",
                "first_name": name,
                "company": cls.company,
                "gender": "Female",
                "date_of_birth": "1990-05-08",
                "date_of_joining": "2013-01-01",
                "status": "Active",
                "employment_type": "Intern",
                "leave_approver": "Administrator",
                "user_id": user_id,
                "ctc": 100000,
                "salary_currency": frappe.get_cached_value("Company", cls.company, "default_currency"),
            }
        )
        employee.insert(ignore_permissions=True)
        return employee.name

    @classmethod
    def _ensure_company_holiday_list_assignment(cls):
        from_date = add_days(today(), -400)
        to_date = add_days(today(), 400)
        if frappe.db.exists(
            "Holiday List Assignment",
            {"assigned_to": cls.company, "docstatus": 1},
        ):
            return
        holiday_list = make_holiday_list(
            COMPANY_HOLIDAY_LIST_NAME, from_date=from_date, to_date=to_date, holiday_dates=[]
        )
        frappe.get_doc(
            {
                "doctype": "Holiday List Assignment",
                "applicable_for": "Company",
                "assigned_to": cls.company,
                "holiday_list": holiday_list.name,
                "from_date": from_date,
            }
        ).insert(ignore_permissions=True).submit()

    @classmethod
    def _assign_employee_holiday_list(cls, employee, holiday_dates):
        """Gives `employee` their own Holiday List Assignment (overriding the company
        default), with `holiday_dates` = list of {"holiday_date": ..., "description": ...}."""
        from_date = add_days(today(), -400)
        to_date = add_days(today(), 400)
        holiday_list = make_holiday_list(
            f"{EMPLOYEE_HOLIDAY_LIST_NAME} {employee}",
            from_date=from_date,
            to_date=to_date,
            holiday_dates=holiday_dates,
        )
        frappe.get_doc(
            {
                "doctype": "Holiday List Assignment",
                "applicable_for": "Employee",
                "assigned_to": employee,
                "holiday_list": holiday_list.name,
                "from_date": from_date,
            }
        ).insert(ignore_permissions=True).submit()

    @classmethod
    def _make_lwp_leave_type(cls):
        if frappe.db.exists("Leave Type", LEAVE_TYPE_NAME):
            return LEAVE_TYPE_NAME
        return (
            frappe.get_doc({"doctype": "Leave Type", "leave_type_name": LEAVE_TYPE_NAME, "is_lwp": 1})
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _make_leave_application(cls, employee, from_date, to_date):
        leave_type = cls._make_lwp_leave_type()
        doc = frappe.get_doc(
            {
                "doctype": "Leave Application",
                "employee": employee,
                "leave_type": leave_type,
                "company": cls.company,
                "from_date": from_date,
                "to_date": to_date,
                "description": "Backdate restriction test leave",
                "posting_date": from_date,
                "status": "Approved",
                "leave_approver": "Administrator",
            }
        )
        doc.insert(ignore_permissions=True)
        doc.submit()
        return doc.name

    @staticmethod
    def _set_timesheet_settings(**kwargs):
        for field, value in kwargs.items():
            frappe.db.set_single_value("Timesheet Settings", field, value)

    @staticmethod
    def _doc(employee, date, ignore_backdated_validation=False):
        """A lightweight stand-in for a Timesheet doc - validate_dates only reads
        .employee/.start_date/.end_date/.ignore_backdated_validation."""
        return frappe._dict(
            employee=employee,
            start_date=getdate(date),
            end_date=getdate(date),
            ignore_backdated_validation=ignore_backdated_validation,
        )

    def tearDown(self):
        frappe.set_user("Administrator")


class TestBackdateRestrictionBoundaryThresholds(_BackdateRestrictionBase):
    """No holidays/leave nearby - the boundary is a plain calendar-day count, so these
    pin down which threshold (employee vs manager) applies to whom."""

    def test_self_view_uses_employee_threshold(self):
        frappe.set_user(EMPLOYEE_USER)
        boundary = get_backdate_restriction_boundary(self.employee)
        self.assertEqual(getdate(boundary), add_days(self.today, -EMPLOYEE_ALLOWED_DAYS))

    def test_manager_viewing_another_employee_uses_manager_threshold(self):
        frappe.set_user(MANAGER_USER)
        boundary = get_backdate_restriction_boundary(self.employee)
        self.assertEqual(getdate(boundary), add_days(self.today, -MANAGER_ALLOWED_DAYS))

    def test_manager_viewing_their_own_record_uses_employee_threshold(self):
        frappe.set_user(MANAGER_USER)
        boundary = get_backdate_restriction_boundary(self.manager_employee)
        self.assertEqual(getdate(boundary), add_days(self.today, -EMPLOYEE_ALLOWED_DAYS))

    def test_plain_viewer_without_manager_role_uses_employee_threshold(self):
        frappe.set_user(PLAIN_VIEWER_USER)
        boundary = get_backdate_restriction_boundary(self.employee)
        self.assertEqual(getdate(boundary), add_days(self.today, -EMPLOYEE_ALLOWED_DAYS))

    def test_viewer_with_no_employee_record_still_gets_manager_threshold(self):
        """A manager-role user with no linked Employee - exercises the
        `viewer_employee is None` branch (None != target is still True). Not
        Administrator, who is exempt from backdate validation entirely and so
        wouldn't exercise this branch at all."""
        frappe.set_user(MANAGER_WITHOUT_EMPLOYEE_USER)
        boundary = get_backdate_restriction_boundary(self.employee)
        self.assertEqual(getdate(boundary), add_days(self.today, -MANAGER_ALLOWED_DAYS))


class TestBackdateRestrictionExemptions(_BackdateRestrictionBase):
    """Users fully exempt from backdate validation - Administrator, or holding a role
    listed in Timesheet Settings' Ignored Role table - must see no restriction at all,
    both in the boundary the frontend reads and in the actual validate_dates check.

    Regression coverage for a real gap: get_backdate_restriction_boundary originally
    didn't know about the Ignored Role exemption at all (only validate_dates did), so a
    user granted an ignored role still saw their cells disabled on the frontend even
    though the backend would have accepted any backdated entry from them.
    """

    @classmethod
    def _add_ignored_role(cls, role_name):
        if not frappe.db.exists("Role", role_name):
            frappe.get_doc({"doctype": "Role", "role_name": role_name}).insert(ignore_permissions=True)
        settings = frappe.get_single("Timesheet Settings")
        if not any(row.role == role_name for row in settings.ignored_role):
            settings.append("ignored_role", {"role": role_name})
            settings.save(ignore_permissions=True)
        frappe.clear_cache()

    def test_administrator_gets_no_boundary(self):
        frappe.set_user("Administrator")
        self.assertIsNone(get_backdate_restriction_boundary(self.employee))

    def test_ignored_role_gets_no_boundary(self):
        role_name = "Backdate Test Ignored Role Boundary"
        self._add_ignored_role(role_name)
        bypass_user = self._make_user("backdate.ignoredrole.boundary@example.com", roles=[role_name])
        frappe.clear_cache()
        frappe.set_user(bypass_user)
        self.assertIsNone(get_backdate_restriction_boundary(self.employee))

    def test_ignored_role_can_save_any_backdated_date(self):
        role_name = "Backdate Test Ignored Role Validate"
        self._add_ignored_role(role_name)
        bypass_user = self._make_user("backdate.ignoredrole.validate@example.com", roles=[role_name])
        frappe.clear_cache()
        frappe.set_user(bypass_user)
        far_past = add_days(self.today, -3650)
        validate_dates(self._doc(self.employee, far_past))  # must not raise

    def test_ignored_role_does_not_exempt_other_viewers(self):
        """Sanity check: adding an ignored role for one test user doesn't accidentally
        exempt everyone - a plain viewer without that role is still restricted normally."""
        role_name = "Backdate Test Ignored Role Sanity"
        self._add_ignored_role(role_name)
        frappe.set_user(EMPLOYEE_USER)
        boundary = get_backdate_restriction_boundary(self.employee)
        self.assertIsNotNone(boundary)
        self.assertEqual(getdate(boundary), add_days(self.today, -EMPLOYEE_ALLOWED_DAYS))


class TestBackdateRestrictionBoundaryMasterToggle(_BackdateRestrictionBase):
    """allow_backdated_entries off entirely - boundary collapses to today regardless
    of thresholds or holidays, matching the backend's separate hard check."""

    def test_boundary_is_today_when_backdating_disabled(self):
        self._set_timesheet_settings(allow_backdated_entries=0)
        frappe.set_user(EMPLOYEE_USER)
        boundary = get_backdate_restriction_boundary(self.employee)
        self.assertEqual(getdate(boundary), self.today)

    def test_boundary_is_today_when_threshold_itself_is_zero(self):
        """Distinct from the master toggle: backdating stays enabled, but the
        configured day count is 0 - still no holiday widening should apply."""
        self._set_timesheet_settings(allow_backdated_entries=1, allow_backdated_entries_till_employee=0)
        frappe.set_user(EMPLOYEE_USER)
        boundary = get_backdate_restriction_boundary(self.employee)
        self.assertEqual(getdate(boundary), self.today)


class TestBackdateRestrictionBoundaryHolidaysAndLeave(_BackdateRestrictionBase):
    """Holidays/weekly-offs/leave inside the window push the boundary further back -
    these don't count against the allowed-days budget.

    Each test method uses its own dedicated employee (fresh, with an empty baseline
    holiday list) rather than the shared `cls.employee` - IntegrationTestCase only
    rolls back per class, not per method, so methods sharing one employee would
    otherwise layer holiday/leave records on top of each other across methods.
    """

    _dedicated_employee_counter = 0

    @classmethod
    def _make_dedicated_employee(cls, holiday_dates=None):
        """A fresh employee with a single holiday-list assignment (defaulting to
        empty). Only one assignment is ever made per employee - HRMS rejects a
        second one overlapping the same date range - so callers who need specific
        holidays pass them here rather than assigning a second list afterward."""
        cls._dedicated_employee_counter += 1
        n = cls._dedicated_employee_counter
        user = f"backdate.dedicated{n}@example.com"
        cls._make_user(user, roles=[])
        employee = cls._make_employee(f"Backdate Dedicated Employee {n}", user)
        cls._assign_employee_holiday_list(employee, holiday_dates or [])
        return employee, user

    def test_holiday_inside_window_pushes_boundary_back_by_one(self):
        holiday_date = add_days(self.today, -2)
        employee, user = self._make_dedicated_employee(
            holiday_dates=[{"holiday_date": holiday_date, "description": "Test Holiday", "weekly_off": 0}],
        )
        frappe.set_user(user)
        boundary = get_backdate_restriction_boundary(employee)
        # Without the holiday: today-3. The holiday at today-2 doesn't count as a
        # working day, so one extra calendar day is needed to reach 3 working days.
        self.assertEqual(getdate(boundary), add_days(self.today, -(EMPLOYEE_ALLOWED_DAYS + 1)))

    def test_leave_inside_window_pushes_boundary_back_by_one(self):
        employee, user = self._make_dedicated_employee()
        leave_date = add_days(self.today, -2)
        self._make_leave_application(employee, leave_date, leave_date)
        frappe.set_user(user)
        boundary = get_backdate_restriction_boundary(employee)
        self.assertEqual(getdate(boundary), add_days(self.today, -(EMPLOYEE_ALLOWED_DAYS + 1)))

    def test_multi_day_leave_pushes_boundary_back_by_its_full_span(self):
        employee, user = self._make_dedicated_employee()
        # A 2-day leave ending today-2 (today-3, today-2) removes 2 working days
        # from the count.
        self._make_leave_application(employee, add_days(self.today, -3), add_days(self.today, -2))
        frappe.set_user(user)
        boundary = get_backdate_restriction_boundary(employee)
        self.assertEqual(getdate(boundary), add_days(self.today, -(EMPLOYEE_ALLOWED_DAYS + 2)))


class TestValidateDatesIntegration(_BackdateRestrictionBase):
    """The actual submit-time validation - confirms it now defers entirely to
    get_backdate_restriction_boundary instead of its own inline calculation."""

    def test_date_on_boundary_is_allowed(self):
        frappe.set_user(EMPLOYEE_USER)
        boundary = get_backdate_restriction_boundary(self.employee)
        validate_dates(self._doc(self.employee, boundary))  # must not raise

    def test_date_one_day_before_boundary_is_rejected(self):
        frappe.set_user(EMPLOYEE_USER)
        boundary = getdate(get_backdate_restriction_boundary(self.employee))
        with self.assertRaises(frappe.ValidationError):
            validate_dates(self._doc(self.employee, add_days(boundary, -1)))

    def test_today_is_always_allowed(self):
        frappe.set_user(EMPLOYEE_USER)
        validate_dates(self._doc(self.employee, self.today))  # must not raise

    def test_future_entry_rejected_when_disallowed(self):
        # Explicit, not just relying on setUpClass's default: a sibling test
        # (test_future_entry_allowed_when_setting_enabled) flips this setting and,
        # since IntegrationTestCase only rolls back per-class, a stale value would
        # otherwise leak into whichever test happens to run next alphabetically.
        self._set_timesheet_settings(allow_future_entries=0)
        frappe.set_user(EMPLOYEE_USER)
        with self.assertRaises(frappe.ValidationError):
            validate_dates(self._doc(self.employee, add_days(self.today, 1)))

    def test_future_entry_allowed_when_setting_enabled(self):
        self._set_timesheet_settings(allow_future_entries=1)
        frappe.set_user(EMPLOYEE_USER)
        validate_dates(self._doc(self.employee, add_days(self.today, 1)))  # must not raise

    def test_ignore_backdated_validation_bypasses_check(self):
        frappe.set_user(EMPLOYEE_USER)
        far_past = add_days(self.today, -365)
        validate_dates(self._doc(self.employee, far_past, ignore_backdated_validation=True))  # must not raise

    def test_administrator_bypasses_check(self):
        frappe.set_user("Administrator")
        far_past = add_days(self.today, -365)
        validate_dates(self._doc(self.employee, far_past))  # must not raise

    def test_multi_day_timesheet_is_rejected_regardless_of_dates(self):
        frappe.set_user(EMPLOYEE_USER)
        doc = frappe._dict(
            employee=self.employee,
            start_date=self.today,
            end_date=add_days(self.today, 1),
            ignore_backdated_validation=False,
        )
        with self.assertRaises(frappe.ValidationError):
            validate_dates(doc)

    def test_timesheet_role_bypasses_check(self):
        role_name = "Backdate Test Bypass Role"
        if not frappe.db.exists("Role", role_name):
            frappe.get_doc({"doctype": "Role", "role_name": role_name}).insert(ignore_permissions=True)

        settings = frappe.get_single("Timesheet Settings")
        if not any(row.role == role_name for row in settings.ignored_role):
            settings.append("ignored_role", {"role": role_name})
            settings.save(ignore_permissions=True)

        bypass_user = self._make_user("backdate.bypass@example.com", roles=[role_name])
        frappe.clear_cache()
        frappe.set_user(bypass_user)
        far_past = add_days(self.today, -365)
        validate_dates(self._doc(self.employee, far_past))  # must not raise
