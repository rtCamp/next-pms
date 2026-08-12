import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, getdate

from next_pms.resource_management.api.allocation import (
    AllocationPayload,
    edit_allocation,
    get_over_allocated_dates,
    upsert_day_override,
)
from next_pms.resource_management.api.utils.leave_sync import LEAVE_SOURCE, MANUAL_SOURCE
from next_pms.resource_management.api.utils.query import get_employee_leaves

# Aug/Sep 2026. Both weeks start on a Monday and hold no weekend days.
MON, TUE, WED, THU, FRI = (
    "2026-08-24",
    "2026-08-25",
    "2026-08-26",
    "2026-08-27",
    "2026-08-28",
)
HOLIDAY_MON, HOLIDAY_FRI = "2026-09-07", "2026-09-11"
PUBLIC_HOLIDAY = "2026-09-09"

HOLIDAY_LIST = "Leave Aware Allocation Holiday List"
EMPLOYEE_USER = "leave-aware-allocation@example.com"
LEAVE_TYPE = "Leave Aware Allocation LWP"

DAILY_HOURS = 8.0


class TestLeaveAwareAllocation(IntegrationTestCase):
    """An allocation must not book hours on days the employee is unavailable.

    Covers `leave_sync` as it is reached in practice — through saving an allocation, through
    `get_over_allocated_dates`, and through the Leave Application resync — since each of those
    is only observable as a change to the allocation.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.holiday_list = cls._make_holiday_list()
        cls.employee = cls._make_employee()
        cls.customer = cls._make_customer()
        cls.project = cls._make_project()
        cls._assign_holiday_list()

        if not frappe.db.exists("Leave Type", LEAVE_TYPE):
            frappe.get_doc(
                {
                    "doctype": "Leave Type",
                    "leave_type_name": LEAVE_TYPE,
                    "is_lwp": 1,
                    "include_holiday": 1,
                }
            ).insert(ignore_permissions=True)

    @classmethod
    def _make_holiday_list(cls):
        frappe.delete_doc_if_exists("Holiday List", HOLIDAY_LIST, force=1)
        holidays = [
            {"holiday_date": PUBLIC_HOLIDAY, "description": "Company Day"},
        ]
        date = getdate("2026-01-01")
        while date <= getdate("2026-12-31"):
            if date.weekday() >= 5:
                holidays.append({"holiday_date": date, "description": date.strftime("%A"), "weekly_off": 1})
            date = add_days(date, 1)

        return (
            frappe.get_doc(
                {
                    "doctype": "Holiday List",
                    "holiday_list_name": HOLIDAY_LIST,
                    "from_date": "2026-01-01",
                    "to_date": "2026-12-31",
                    "holidays": holidays,
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _assign_holiday_list(cls):
        """HRMS resolves an employee's holidays through Holiday List Assignment; the
        `holiday_list` field on Employee alone leaves them on the company default."""
        if frappe.db.exists(
            "Holiday List Assignment",
            {"assigned_to": cls.employee, "holiday_list": cls.holiday_list, "docstatus": 1},
        ):
            return

        frappe.get_doc(
            {
                "doctype": "Holiday List Assignment",
                "applicable_for": "Employee",
                "assigned_to": cls.employee,
                "holiday_list": cls.holiday_list,
                "from_date": "2026-01-01",
            }
        ).insert(ignore_permissions=True).submit()

    @classmethod
    def _make_employee(cls):
        existing = frappe.db.get_value("Employee", {"company_email": EMPLOYEE_USER})
        if existing:
            frappe.db.set_value("Employee", existing, "holiday_list", cls.holiday_list)
            return existing

        employee = frappe.get_doc(
            {
                "doctype": "Employee",
                "naming_series": "EMP-",
                "first_name": "Leave Aware",
                "company": cls.company,
                "gender": "Female",
                "date_of_birth": "1990-05-08",
                "date_of_joining": "2013-01-01",
                "status": "Active",
                "employment_type": "Intern",
                "leave_approver": "Administrator",
                "company_email": EMPLOYEE_USER,
                "holiday_list": cls.holiday_list,
                "ctc": 100000,
                "salary_currency": "INR",
            }
        ).insert(ignore_permissions=True)
        return employee.name

    @classmethod
    def _make_customer(cls):
        customer = frappe.db.get_value("Customer", {}, "name")
        if customer:
            return customer
        return (
            frappe.get_doc(
                {
                    "doctype": "Customer",
                    "customer_name": "Leave Aware Allocation Customer",
                    "customer_type": "Company",
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _make_project(cls):
        name = frappe.db.get_value("Project", {"project_name": "Leave Aware Allocation Project"})
        if name:
            return name
        return (
            frappe.get_doc(
                {
                    "doctype": "Project",
                    "project_name": "Leave Aware Allocation Project",
                    "company": cls.company,
                    "customer": cls.customer,
                    "custom_billing_type": "Non-Billable",
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    def tearDown(self):
        for leave in frappe.get_all("Leave Application", filters={"employee": self.employee}, pluck="name"):
            frappe.delete_doc("Leave Application", leave, force=1, ignore_permissions=True)
        for allocation in frappe.get_all("Resource Allocation", filters={"employee": self.employee}, pluck="name"):
            frappe.delete_doc("Resource Allocation", allocation, force=1, ignore_permissions=True)
        get_employee_leaves.clear_cache()

    # --- fixtures ---------------------------------------------------------

    def _allocate(self, start=MON, end=FRI, hours=DAILY_HOURS):
        return frappe.get_doc(
            {
                "doctype": "Resource Allocation",
                "employee": self.employee,
                "project": self.project,
                "customer": self.customer,
                "allocation_start_date": start,
                "allocation_end_date": end,
                "hours_allocated_per_day": hours,
                "include_weekends": 0,
                "status": "Confirmed",
            }
        ).insert(ignore_permissions=True)

    def _apply_leave(self, from_date, to_date, half_day=False, half_day_date=None, submit=False):
        get_employee_leaves.clear_cache()
        leave = frappe.get_doc(
            {
                "doctype": "Leave Application",
                "employee": self.employee,
                "leave_type": LEAVE_TYPE,
                "from_date": from_date,
                "to_date": to_date,
                "half_day": 1 if half_day else 0,
                "half_day_date": half_day_date or (from_date if half_day else None),
                "description": "leave aware allocation test",
                "leave_approver": "Administrator",
                "status": "Approved",
            }
        ).insert(ignore_permissions=True)

        if submit:
            leave.submit()
        return leave

    def _overrides(self, allocation):
        allocation.reload()
        return {str(getdate(row.date)): row for row in allocation.override}

    # --- guards on the fixture itself --------------------------------------

    def test_public_holiday_resolves_for_the_employee(self):
        """Without this, the holiday assertions below would pass for the wrong reason."""
        from erpnext.setup.doctype.employee.employee import get_holiday_list_for_employee

        self.assertEqual(get_holiday_list_for_employee(self.employee), self.holiday_list)

    # --- creating an allocation over leave ---------------------------------

    def test_full_day_leave_is_cancelled(self):
        self._apply_leave(WED, THU)
        allocation = self._allocate()

        overrides = self._overrides(allocation)
        self.assertEqual(set(overrides), {WED, THU})
        for date in (WED, THU):
            self.assertEqual(overrides[date].cancelled, 1)
            self.assertEqual(overrides[date].hours, 0)
            self.assertEqual(overrides[date].source, LEAVE_SOURCE)

        self.assertEqual(allocation.total_allocated_hours, 3 * DAILY_HOURS)

    def test_half_day_leave_is_halved(self):
        self._apply_leave(WED, WED, half_day=True)
        allocation = self._allocate()

        overrides = self._overrides(allocation)
        self.assertEqual(set(overrides), {WED})
        self.assertEqual(overrides[WED].hours, DAILY_HOURS / 2)
        self.assertEqual(overrides[WED].cancelled, 0)
        self.assertEqual(allocation.total_allocated_hours, 4 * DAILY_HOURS + DAILY_HOURS / 2)

    def test_half_day_halves_the_allocation_not_the_capacity(self):
        """A deliberately over-allocated day stays over-allocated — halved, never clamped."""
        self._apply_leave(WED, WED, half_day=True)
        allocation = self._allocate(hours=10)

        self.assertEqual(self._overrides(allocation)[WED].hours, 5)

    def test_public_holiday_is_cancelled(self):
        allocation = self._allocate(start=HOLIDAY_MON, end=HOLIDAY_FRI)

        overrides = self._overrides(allocation)
        self.assertEqual(set(overrides), {PUBLIC_HOLIDAY})
        self.assertEqual(overrides[PUBLIC_HOLIDAY].cancelled, 1)
        self.assertEqual(allocation.total_allocated_hours, 4 * DAILY_HOURS)

    def test_employee_without_leave_is_untouched(self):
        allocation = self._allocate()

        self.assertEqual(allocation.override, [])
        self.assertEqual(allocation.total_allocated_hours, 5 * DAILY_HOURS)

    # --- the over-allocation warning ---------------------------------------

    def _warning(self, start=MON, end=FRI, hours=DAILY_HOURS):
        return get_over_allocated_dates(employee=self.employee, start_date=start, end_date=end, hours_per_day=hours)

    def test_leave_alone_raises_no_warning(self):
        self._apply_leave(WED, THU)

        self.assertEqual(self._warning()["dates"], [])

    def test_half_day_leave_alone_raises_no_warning(self):
        self._apply_leave(WED, WED, half_day=True)

        self.assertEqual(self._warning()["dates"], [])

    def test_genuine_double_booking_still_warns(self):
        self._allocate()

        flagged = {entry["date"] for entry in self._warning()["dates"]}
        self.assertEqual(flagged, {MON, TUE, WED, THU, FRI})

    def test_double_booking_on_a_leave_day_still_warns(self):
        """Leave silences the warning it causes — not one an existing booking causes."""
        self._apply_leave(WED, THU)
        self._allocate()

        flagged = {entry["date"] for entry in self._warning()["dates"]}
        self.assertEqual(flagged, {MON, TUE, FRI})

    # --- leave changing after the allocation exists -------------------------

    def test_leave_approved_after_allocation_updates_it(self):
        allocation = self._allocate()
        self.assertEqual(allocation.override, [])

        self._apply_leave(WED, THU)

        self.assertEqual(set(self._overrides(allocation)), {WED, THU})
        self.assertEqual(allocation.total_allocated_hours, 3 * DAILY_HOURS)

    def test_deleted_leave_restores_the_days(self):
        allocation = self._allocate()
        leave = self._apply_leave(WED, THU)
        self.assertEqual(set(self._overrides(allocation)), {WED, THU})

        frappe.delete_doc("Leave Application", leave.name, force=1, ignore_permissions=True)

        self.assertEqual(self._overrides(allocation), {})
        self.assertEqual(allocation.total_allocated_hours, 5 * DAILY_HOURS)

    def test_cancelled_leave_restores_the_days(self):
        allocation = self._allocate()
        leave = self._apply_leave(WED, THU, submit=True)
        self.assertEqual(set(self._overrides(allocation)), {WED, THU})

        leave.cancel()

        self.assertEqual(self._overrides(allocation), {})
        self.assertEqual(allocation.total_allocated_hours, 5 * DAILY_HOURS)

    def test_amended_leave_frees_the_dates_it_moved_off(self):
        allocation = self._allocate()
        leave = self._apply_leave(WED, THU)

        leave.to_date = WED
        leave.save(ignore_permissions=True)

        self.assertEqual(set(self._overrides(allocation)), {WED})
        self.assertEqual(allocation.total_allocated_hours, 4 * DAILY_HOURS)

    # --- interaction with manual overrides ---------------------------------

    def test_manual_override_on_a_free_day_survives_a_resync(self):
        allocation = self._allocate()
        upsert_day_override(allocation.name, TUE, {"hours": 3})

        self._apply_leave(WED, THU)

        overrides = self._overrides(allocation)
        self.assertEqual(overrides[TUE].hours, 3)
        self.assertEqual(overrides[TUE].source, MANUAL_SOURCE)
        self.assertEqual(set(overrides), {TUE, WED, THU})

    def test_leave_takes_over_a_manual_override_on_a_leave_day(self):
        allocation = self._allocate()
        upsert_day_override(allocation.name, WED, {"hours": 3})

        self._apply_leave(WED, WED)

        override = self._overrides(allocation)[WED]
        self.assertEqual(override.cancelled, 1)
        self.assertEqual(override.source, LEAVE_SOURCE)

    def test_changing_hours_keeps_the_leave_days_skipped(self):
        """`edit_allocation` wipes the override table on an hours change; leave must return."""
        self._apply_leave(WED, THU)
        allocation = self._allocate()

        edit_allocation(
            name=allocation.name,
            edit_mode="only_this",
            allocation=AllocationPayload(
                doctype="Resource Allocation",
                employee=self.employee,
                customer=self.customer,
                project=self.project,
                allocation_start_date=MON,
                allocation_end_date=FRI,
                hours_allocated_per_day=6,
                include_weekends=False,
            ),
        )

        overrides = self._overrides(allocation)
        self.assertEqual(set(overrides), {WED, THU})
        self.assertEqual(allocation.total_allocated_hours, 3 * 6)
