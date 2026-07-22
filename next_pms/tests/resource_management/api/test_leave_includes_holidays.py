import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, getdate

from next_pms.resource_management.api.utils.query import (
    get_employee_leaves,
    leave_includes_holidays,
)
from next_pms.tests.utils import make_employee, make_holiday_list
from next_pms.timesheet.api.team import get_compact_view_data

# Aug 2026: Mon 10 … Fri 14, Sat 15 + Sun 16 weekly off, Mon 17 … Wed 19.
MON, FRI = "2026-08-10", "2026-08-14"
SAT, SUN = "2026-08-15", "2026-08-16"
TUE_NEXT, WED_NEXT = "2026-08-18", "2026-08-19"
THU = "2026-08-13"

# Sep 2026, one weekend per test so the two Leave Applications never overlap.
SEP_THU, SEP_FRI = "2026-09-10", "2026-09-11"
SEP_SAT, SEP_SUN = "2026-09-12", "2026-09-13"
SEP_TUE_NEXT = "2026-09-15"

HOLIDAY_LIST = "Leave Weekend Test Holiday List"
EMPLOYEE_USER = "leave-weekend-test@example.com"

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
    """A leave spanning a weekend is rendered to match what the backend actually counted.

    Both leave types below are `is_lwp` so no Leave Allocation is needed, and both are
    configured so that stock HRMS and rtCamp's override agree on the outcome — the
    assertions hold whether or not the rtcamp app is installed.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
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

        make_holiday_list(HOLIDAY_LIST, from_date="2026-01-01", to_date="2026-12-31", holiday_dates=weekends)
        cls.employee = make_employee(
            EMPLOYEE_USER,
            company=get_default_company(),
            holiday_list=HOLIDAY_LIST,
            leave_approver="Administrator",
        )

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

    def tearDown(self):
        get_employee_leaves.clear_cache()
        frappe.cache().delete_keys("emp_timesheet")

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

    def _weekend_hours(self, week_of):
        payload = get_compact_view_data(
            date=week_of, max_week=1, employee_ids=[self.employee], by_pass_access_check=True
        )
        row = payload["data"][self.employee]
        days = {str(day["date"]): day for day in row["data"]}
        return row["working_hour"], days

    def test_leave_counting_the_weekend_renders_across_it(self):
        leave = self._apply_leave(INCLUDES_HOLIDAYS_TYPE, THU, WED_NEXT)

        row = next(r for r in get_employee_leaves(self.employee, THU, WED_NEXT) if r["name"] == leave.name)
        self.assertTrue(row["includes_holidays"])

        working_hour, days = self._weekend_hours(THU)
        self.assertEqual(days[SAT]["hour"], working_hour)
        self.assertTrue(days[SAT]["is_leave"])
        self.assertEqual(days[SUN]["hour"], working_hour)
        self.assertTrue(days[SUN]["is_leave"])

        # Working days inside the range are unaffected.
        self.assertEqual(days[FRI]["hour"], working_hour)
        self.assertTrue(days[FRI]["is_leave"])

    def test_leave_dropping_the_weekend_skips_it(self):
        leave = self._apply_leave(EXCLUDES_HOLIDAYS_TYPE, SEP_THU, SEP_TUE_NEXT)

        row = next(r for r in get_employee_leaves(self.employee, SEP_THU, SEP_TUE_NEXT) if r["name"] == leave.name)
        self.assertFalse(row["includes_holidays"])

        working_hour, days = self._weekend_hours(SEP_THU)
        self.assertEqual(days[SEP_SAT]["hour"], 0)
        self.assertFalse(days[SEP_SAT]["is_leave"])
        self.assertEqual(days[SEP_SUN]["hour"], 0)
        self.assertFalse(days[SEP_SUN]["is_leave"])

        # Working days inside the range are unaffected.
        self.assertEqual(days[SEP_FRI]["hour"], working_hour)
        self.assertTrue(days[SEP_FRI]["is_leave"])
