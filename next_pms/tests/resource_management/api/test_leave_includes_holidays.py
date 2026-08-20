import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, getdate

from next_pms.resource_management.api.utils.query import (
    get_employee_leaves,
    leave_includes_holidays,
)
from next_pms.tests.utils import make_employee, make_holiday_list
from next_pms.timesheet.api.team import get_team_timesheet_data
from next_pms.timesheet.api.utils import get_holidays

# Aug 2026: Mon 10 … Fri 14, Sat 15 + Sun 16 weekly off, Mon 17 … Wed 19.
MON, FRI = "2026-08-10", "2026-08-14"
SAT, SUN = "2026-08-15", "2026-08-16"
TUE_NEXT, WED_NEXT = "2026-08-18", "2026-08-19"
THU = "2026-08-13"

# Sep 2026, one weekend per test so the two Leave Applications never overlap.
SEP_THU = "2026-09-10"
SEP_SAT, SEP_SUN = "2026-09-12", "2026-09-13"
SEP_TUE_NEXT = "2026-09-15"

HOLIDAY_LIST = "Leave Weekend Test Holiday List"
EMPLOYEE_USER = "leave-weekend-test@example.com"
MANAGER_USER = "leave-weekend-test-manager@example.com"

INCLUDES_HOLIDAYS_TYPE = "Leave Weekend Test Incl"
EXCLUDES_HOLIDAYS_TYPE = "Leave Weekend Test Excl"


class TestLeaveIncludesHolidays(IntegrationTestCase):
    """`leave_includes_holidays` compares the stored day count against the raw calendar span."""

    def test_full_span_counted_means_holidays_included(self):
        leave = {"from_date": getdate(THU), "to_date": getdate(WED_NEXT), "total_leave_days": 7}
        self.assertTrue(leave_includes_holidays(leave))

    def test_short_count_means_holidays_excluded(self):
        # Fri->Mon counted as 2 days: the weekend was dropped.
        leave = {"from_date": getdate(FRI), "to_date": getdate("2026-08-17"), "total_leave_days": 2}
        self.assertFalse(leave_includes_holidays(leave))

    def test_boundary_between_four_and_five_working_days(self):
        """A policy that drops holidays below a threshold flips the flag on the day count alone.

        rtCamp's override counts weekends only once unpaid leave reaches five working
        days. Both sides of that boundary must be read off `total_leave_days` without
        this helper knowing the rule exists.
        """
        four_working_days = {"from_date": getdate(THU), "to_date": getdate(TUE_NEXT), "total_leave_days": 4}
        five_working_days = {"from_date": getdate(THU), "to_date": getdate(WED_NEXT), "total_leave_days": 7}

        self.assertFalse(leave_includes_holidays(four_working_days))
        self.assertTrue(leave_includes_holidays(five_working_days))

    def test_half_day_on_single_day(self):
        leave = {
            "from_date": getdate(MON),
            "to_date": getdate(MON),
            "half_day": 1,
            "half_day_date": getdate(MON),
            "total_leave_days": 0.5,
        }
        self.assertTrue(leave_includes_holidays(leave))

    def test_half_day_within_multi_day_range(self):
        base = {
            "from_date": getdate(FRI),
            "to_date": getdate("2026-08-17"),
            "half_day": 1,
            "half_day_date": getdate("2026-08-17"),
        }
        # Raw span is 3.5 days (4 calendar days, one of them a half day).
        self.assertTrue(leave_includes_holidays({**base, "total_leave_days": 3.5}))
        self.assertFalse(leave_includes_holidays({**base, "total_leave_days": 1.5}))

    def test_half_day_date_outside_range_does_not_shorten_span(self):
        leave = {
            "from_date": getdate(THU),
            "to_date": getdate(FRI),
            "half_day": 1,
            "half_day_date": getdate(WED_NEXT),
            "total_leave_days": 2,
        }
        self.assertTrue(leave_includes_holidays(leave))

    def test_missing_total_leave_days_is_treated_as_excluding_holidays(self):
        leave = {"from_date": getdate(THU), "to_date": getdate(FRI), "total_leave_days": None}
        self.assertFalse(leave_includes_holidays(leave))


class TestLeaveWeekendRendering(IntegrationTestCase):
    """A leave spanning a weekend reaches the frontend flagged with what the backend counted.

    The team timesheet refactor stopped folding leaves into per-day hours server-side;
    `get_team_timesheet_data` now ships the raw leave rows and the frontend's
    `calculateLeaveHours` applies the weekend rule. So the backend's remaining
    responsibility - and all this class can assert - is that `includes_holidays` is
    derived correctly from a real Leave Application and survives onto the member row.
    The per-day arithmetic it feeds is frontend logic and needs frontend coverage.

    The employee reports to a manager so it surfaces under `reports_to`.

    Both leave types below are `is_lwp` so no Leave Allocation is needed, and both are
    configured so that stock HRMS and rtCamp's override agree on the outcome — the
    assertions hold whether or not the rtcamp app is installed.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # The framework rolls back the DefaultValue row at class teardown, but set_default also
        # rewarms a non-transactional cache that rollback won't revert, so restore it explicitly.
        cls._prev_first_day_of_the_week = frappe.db.get_default("first_day_of_the_week")
        frappe.db.set_default("first_day_of_the_week", "Monday")

        weekends = []
        date = getdate("2026-01-01")
        while date <= getdate("2026-12-31"):
            if date.weekday() >= 5:
                weekends.append(
                    {
                        "holiday_date": date,
                        "description": date.strftime("%A"),
                        "weekly_off": 1,
                    }
                )
            date = add_days(date, 1)

        holiday_list = make_holiday_list(
            HOLIDAY_LIST, from_date="2026-01-01", to_date="2026-12-31", holiday_dates=weekends
        )
        cls.manager = make_employee(MANAGER_USER, company=get_default_company(), leave_approver="Administrator")
        cls.employee = make_employee(
            EMPLOYEE_USER,
            company=get_default_company(),
            leave_approver="Administrator",
            reports_to=cls.manager,
        )
        # Employee.holiday_list is ignored; HRMS resolves via Holiday List Assignment.
        if not frappe.db.exists(
            "Holiday List Assignment",
            {"assigned_to": cls.employee, "from_date": "2026-01-01", "docstatus": 1},
        ):
            frappe.get_doc(
                {
                    "doctype": "Holiday List Assignment",
                    "applicable_for": "Employee",
                    "assigned_to": cls.employee,
                    "holiday_list": holiday_list.name,
                    "from_date": "2026-01-01",
                }
            ).insert(ignore_permissions=True).submit()

        for name, include_holiday in ((INCLUDES_HOLIDAYS_TYPE, 1), (EXCLUDES_HOLIDAYS_TYPE, 0)):
            if not frappe.db.exists("Leave Type", name):
                frappe.get_doc(
                    {
                        "doctype": "Leave Type",
                        "leave_type_name": name,
                        "include_holiday": include_holiday,
                        "is_lwp": 1,
                    }
                ).insert()

        # A previous aborted run can leave applications behind and trip the overlap check.
        for leave in frappe.get_all("Leave Application", filters={"employee": cls.employee}, pluck="name"):
            frappe.delete_doc("Leave Application", leave, force=1, ignore_permissions=True)

    @classmethod
    def tearDownClass(cls):
        frappe.db.set_default("first_day_of_the_week", cls._prev_first_day_of_the_week)
        super().tearDownClass()

    def tearDown(self):
        get_employee_leaves.clear_cache()
        get_holidays.clear_cache()
        frappe.cache().delete_keys("emp_timesheet")

    def test_weekends_resolve_as_holidays_for_the_employee(self):
        """Guards the fixture itself.

        HRMS resolves an employee's holiday list through Holiday List Assignment, so a
        missing assignment yields no holidays at all — and then every weekend assertion
        below passes for the wrong reason instead of failing.
        """
        holidays = {str(h.holiday_date): h for h in get_holidays(self.employee, SEP_THU, SEP_TUE_NEXT)}

        for weekend_day in (SEP_SAT, SEP_SUN):
            self.assertIn(weekend_day, holidays)
            self.assertTrue(holidays[weekend_day].weekly_off)

    def _apply_leave(self, leave_type, from_date, to_date):
        get_employee_leaves.clear_cache()
        frappe.cache().delete_keys("emp_timesheet")
        return frappe.get_doc(
            {
                "doctype": "Leave Application",
                "employee": self.employee,
                "leave_type": leave_type,
                "from_date": from_date,
                "to_date": to_date,
                "description": "weekend rendering test",
                "leave_approver": "Administrator",
                "status": "Open",
            }
        ).insert()

    def _member_leave(self, week_of, leave_name):
        """The leave row as the team page receives it, for the week containing `week_of`."""
        payload = get_team_timesheet_data(start_date=week_of, reports_to=self.manager)
        member = next(m for m in payload["members"] if m["employee"] == self.employee)
        return next(lv for lv in member["leaves"] if lv["name"] == leave_name)

    def test_leave_counting_the_weekend_is_flagged_inclusive(self):
        leave = self._apply_leave(INCLUDES_HOLIDAYS_TYPE, THU, WED_NEXT)

        row = next(r for r in get_employee_leaves(self.employee, THU, WED_NEXT) if r["name"] == leave.name)
        self.assertTrue(row["includes_holidays"])

        # The same verdict has to reach the team page, which spans SAT/SUN off it.
        self.assertTrue(self._member_leave(THU, leave.name)["includes_holidays"])

    def test_leave_dropping_the_weekend_is_flagged_exclusive(self):
        leave = self._apply_leave(EXCLUDES_HOLIDAYS_TYPE, SEP_THU, SEP_TUE_NEXT)

        row = next(r for r in get_employee_leaves(self.employee, SEP_THU, SEP_TUE_NEXT) if r["name"] == leave.name)
        self.assertFalse(row["includes_holidays"])

        member_row = self._member_leave(SEP_THU, leave.name)
        self.assertFalse(member_row["includes_holidays"])

        # The flag is only actionable if the row it rides on actually spans the weekend -
        # the frontend derives which days to skip from from_date/to_date.
        self.assertLessEqual(getdate(member_row["from_date"]), getdate(SEP_SAT))
        self.assertGreaterEqual(getdate(member_row["to_date"]), getdate(SEP_SUN))
