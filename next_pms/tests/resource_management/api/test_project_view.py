import json

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.resource_management.api.project import get_resource_management_project_view_data

WRITE_USER = "pv.write@example.com"
READ_ONLY_USER = "pv.readonly@example.com"

# A Monday, so the derived window is [2026-06-15, 2026-06-28] for max_week=2.
DATE = "2026-06-15"
WINDOW_START = "2026-06-15"
WINDOW_END = "2026-06-28"


class _ProjectViewBase(IntegrationTestCase):
    """Shared fixture factories for the project-view endpoint tests.

    All filter assertions run as a write user (Projects User role); the endpoint blanks
    every filter except project_name for non-write callers.
    """

    @classmethod
    def _make_user(cls, email, projects_user=False):
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
        if projects_user:
            frappe.get_doc("User", email).add_roles("Projects User")
        return email

    @classmethod
    def _make_employee(cls, employee_name, user_id=None):
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
                # The rtcamp Employee doc-event derives leave_approver from reports_to
                # when left blank and errors on a None reports_to; set it up front.
                "leave_approver": "Administrator",
                "user_id": user_id,
            }
        )
        employee.insert(ignore_permissions=True)
        return employee.name

    @classmethod
    def _make_customer(cls, customer_name):
        existing = frappe.db.get_value("Customer", {"customer_name": customer_name})
        if existing:
            return existing
        return (
            frappe.get_doc(
                {
                    "doctype": "Customer",
                    "customer_name": customer_name,
                    "customer_type": "Company",
                    "default_currency": frappe.get_cached_value("Company", cls.company, "default_currency"),
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _make_project_type(cls, project_type):
        if not frappe.db.exists("Project Type", project_type):
            frappe.get_doc({"doctype": "Project Type", "project_type": project_type}).insert(ignore_permissions=True)
        return project_type

    @classmethod
    def _make_project(
        cls,
        project_name,
        customer,
        status="Open",
        billing_type="Non-Billable",
        project_type=None,
        project_manager=None,
        tags=(),
    ):
        doc = frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": project_name,
                "company": cls.company,
                "customer": customer,
                "custom_billing_type": billing_type,
                "status": status,
            }
        )
        if project_type:
            doc.project_type = project_type
        if project_manager:
            doc.custom_project_manager = project_manager
        doc.insert(ignore_permissions=True)
        for tag in tags:
            doc.add_tag(tag)
        return doc.name

    @classmethod
    def _make_allocation(cls, employee, project, start, end, is_billable=0, status="Confirmed"):
        return (
            frappe.get_doc(
                {
                    "doctype": "Resource Allocation",
                    "employee": employee,
                    "project": project,
                    "allocation_start_date": start,
                    "allocation_end_date": end,
                    "hours_allocated_per_day": 8,
                    "status": status,
                    "is_billable": is_billable,
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    def tearDown(self):
        frappe.set_user("Administrator")

    def _call(self, user=WRITE_USER, **kwargs):
        frappe.set_user(user)
        return get_resource_management_project_view_data(date=DATE, **kwargs)

    def _entry(self, result, project_id):
        return next(entry for entry in result["data"] if entry["name"] == project_id)

    def _project_ids(self, result):
        return {entry["name"] for entry in result["data"]}


class TestProjectViewProjectListFilters(_ProjectViewBase):
    """Which projects the project view returns — filter_project_list branches."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.write_user = cls._make_user(WRITE_USER, projects_user=True)

        # Read-only user only clears the endpoint's role gate via the Employee role.
        cls.read_only_user = cls._make_user(READ_ONLY_USER)
        cls._make_employee("PV Readonly", user_id=cls.read_only_user)

        cls.pm_a = cls._make_user("pv.pm.a@example.com")
        cls.pm_b = cls._make_user("pv.pm.b@example.com")
        cls.type_ext = cls._make_project_type("QA External")
        cls.type_int = cls._make_project_type("QA Internal")

        # A scope customer carries most single-attribute-varying projects so filters can
        # be ANDed with customer=[C_main] to isolate the fixtures from the rest of the DB.
        cls.c_main = cls._make_customer("PV Main Customer")
        cls.c_other = cls._make_customer("PV Other Customer")

        cls.p_alpha = cls._make_project(
            "PV Alpha Portal",
            cls.c_main,
            billing_type="Time and Material",
            project_type=cls.type_ext,
            project_manager=cls.pm_a,
            tags=["pv-tag-a"],
        )
        cls.p_beta = cls._make_project(
            "PV Beta Portal",
            cls.c_main,
            billing_type="Fixed Cost",
            project_type=cls.type_int,
            project_manager=cls.pm_b,
            tags=["pv-tag-b"],
        )
        cls.p_completed = cls._make_project("PV Gamma Portal", cls.c_main, status="Completed")
        cls.p_cancelled = cls._make_project("PV Delta Portal", cls.c_main, status="Cancelled")
        cls.p_other = cls._make_project("PV Epsilon Portal", cls.c_other)

        frappe.clear_cache()

    def test_closed_projects_excluded(self):
        result = self._call(customer=self.c_main)
        self.assertEqual(self._project_ids(result), {self.p_alpha, self.p_beta})
        self.assertEqual(result["total_count"], 2)

    def test_project_name_like(self):
        result = self._call(project_name="Alpha Portal")
        self.assertEqual(self._project_ids(result), {self.p_alpha})

    def test_customer_single_and_multi(self):
        single = self._call(customer=self.c_other)
        self.assertEqual(self._project_ids(single), {self.p_other})

        both = self._call(customer=json.dumps([self.c_main, self.c_other]))
        self.assertEqual(both["total_count"], 3)  # 2 open under c_main + 1 under c_other
        self.assertEqual(self._project_ids(both), {self.p_alpha, self.p_beta, self.p_other})

    def test_billing_type(self):
        result = self._call(customer=self.c_main, billing_type=json.dumps(["Fixed Cost"]))
        self.assertEqual(self._project_ids(result), {self.p_beta})

    def test_project_type(self):
        result = self._call(customer=self.c_main, project_type=json.dumps([self.type_ext]))
        self.assertEqual(self._project_ids(result), {self.p_alpha})

    def test_project_manager(self):
        result = self._call(customer=self.c_main, project_manager=json.dumps([self.pm_b]))
        self.assertEqual(self._project_ids(result), {self.p_beta})

    def test_tag(self):
        result = self._call(tag=json.dumps(["pv-tag-a"]))
        self.assertEqual(self._project_ids(result), {self.p_alpha})

    def test_project_id_short_circuits_dedicated_but_keeps_status_exclusion(self):
        # A closed project passed via project_id is still dropped by the status filter,
        # and the dedicated project_name filter is ignored when project_id is set.
        result = self._call(
            project_id=json.dumps([self.p_alpha, self.p_completed]),
            project_name="no-such-name",
        )
        self.assertEqual(self._project_ids(result), {self.p_alpha})

    def test_composite_filter_operators(self):
        eq = self._call(filters=json.dumps([["customer", "=", self.c_main], ["project_name", "like", "Beta"]]))
        self.assertEqual(self._project_ids(eq), {self.p_beta})

        neq = self._call(filters=json.dumps([["customer", "=", self.c_main], ["project_name", "not like", "Beta"]]))
        self.assertEqual(self._project_ids(neq), {self.p_alpha})

    def test_pagination(self):
        page1 = self._call(customer=self.c_main, page_length=1, start=0)
        self.assertEqual(len(page1["data"]), 1)
        self.assertEqual(page1["total_count"], 2)
        self.assertTrue(page1["has_more"])

        page2 = self._call(customer=self.c_main, page_length=1, start=1)
        self.assertEqual(len(page2["data"]), 1)
        self.assertEqual(page2["total_count"], 2)
        self.assertFalse(page2["has_more"])

    def test_non_write_user_ignores_filters_except_name(self):
        # customer=[c_other] would exclude p_alpha (under c_main) if honored; a read-only
        # caller must ignore it and still return p_alpha via the name filter.
        result = self._call(user=READ_ONLY_USER, customer=self.c_other, project_name="Alpha Portal")
        self.assertFalse(result["permissions"]["write"])
        self.assertIn(self.p_alpha, self._project_ids(result))


class TestProjectViewAllocationFilters(_ProjectViewBase):
    """The per-project allocation breakdown — allocation query branches.

    These filters change which allocations appear (project_allocations) and drop
    projects left without a single matching allocation in the window.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.write_user = cls._make_user(WRITE_USER, projects_user=True)
        cls.customer = cls._make_customer("PV Alloc Customer")
        cls.project = cls._make_project("PV Alloc Portal", cls.customer)
        cls.employee = cls._make_employee("PV Alloc Employee")

        # In-window allocations. Kept disjoint per employee+project so the
        # overlap guard on Resource Allocation doesn't reject the fixtures.
        cls.a_billable = cls._make_allocation(
            cls.employee, cls.project, "2026-06-16", "2026-06-19", is_billable=1, status="Confirmed"
        )
        cls.a_nonbillable = cls._make_allocation(
            cls.employee, cls.project, "2026-06-20", "2026-06-24", is_billable=0, status="Tentative"
        )
        # End == window start: inclusive overlap keeps it.
        cls.a_boundary = cls._make_allocation(
            cls.employee, cls.project, "2026-06-10", WINDOW_START, is_billable=1, status="Confirmed"
        )
        # Out-of-window allocations that must be excluded.
        cls.a_before = cls._make_allocation(
            cls.employee, cls.project, "2026-06-01", "2026-06-07", is_billable=1, status="Confirmed"
        )
        cls.a_after = cls._make_allocation(
            cls.employee, cls.project, "2026-07-01", "2026-07-05", is_billable=0, status="Tentative"
        )

        frappe.clear_cache()

    def _allocation_names(self, **kwargs):
        result = self._call(project_id=json.dumps([self.project]), **kwargs)
        return set(self._entry(result, self.project)["project_allocations"].keys())

    def test_out_of_window_allocations_excluded(self):
        names = self._allocation_names()
        self.assertEqual(names, {self.a_billable, self.a_nonbillable, self.a_boundary})
        self.assertNotIn(self.a_before, names)
        self.assertNotIn(self.a_after, names)

    def test_is_billable_one_keeps_only_billable(self):
        names = self._allocation_names(is_billable="1")
        self.assertEqual(names, {self.a_billable, self.a_boundary})

    def test_is_billable_zero_is_honored(self):
        # 0 must be a real filter, not swallowed like the -1/None "no filter" sentinel.
        names = self._allocation_names(is_billable="0")
        self.assertEqual(names, {self.a_nonbillable})

    def test_allocation_status_filter(self):
        confirmed = self._allocation_names(allocation_status=json.dumps(["Confirmed"]))
        self.assertEqual(confirmed, {self.a_billable, self.a_boundary})

        tentative = self._allocation_names(allocation_status=json.dumps(["Tentative"]))
        self.assertEqual(tentative, {self.a_nonbillable})

    def test_allocation_filters_drop_projects_without_matching_allocations(self):
        # No in-window allocation is both non-billable and Confirmed, so the project
        # is excluded from the payload instead of rendering as an empty row.
        result = self._call(
            project_id=json.dumps([self.project]), is_billable="0", allocation_status=json.dumps(["Confirmed"])
        )
        self.assertEqual(result["data"], [])
        self.assertEqual(result["total_count"], 0)
        self.assertFalse(result["has_more"])


class TestProjectViewAllocationProjectFiltering(_ProjectViewBase):
    """Which projects the allocation-level filters keep, and how unfiltered rows order.

    With allocation_status / is_billable active only projects owning a matching
    in-window allocation survive; without them, allocated projects paginate before
    projects that have no allocation in the window.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.write_user = cls._make_user(WRITE_USER, projects_user=True)
        cls.customer = cls._make_customer("PV Partition Customer")
        cls.employee = cls._make_employee("PV Partition Employee")

        cls.p_confirmed = cls._make_project("PV Zeta Portal", cls.customer)
        cls.p_tentative = cls._make_project("PV Eta Portal", cls.customer)
        cls.p_empty = cls._make_project("PV Theta Portal", cls.customer)

        cls._make_allocation(
            cls.employee, cls.p_confirmed, "2026-06-16", "2026-06-17", is_billable=1, status="Confirmed"
        )
        cls._make_allocation(
            cls.employee, cls.p_tentative, "2026-06-18", "2026-06-19", is_billable=0, status="Tentative"
        )
        # p_empty only has an out-of-window allocation, so the window guard must
        # treat it as having no allocations.
        cls._make_allocation(cls.employee, cls.p_empty, "2026-07-06", "2026-07-08", is_billable=1, status="Confirmed")

        frappe.clear_cache()

    def _scoped_call(self, **kwargs):
        return self._call(customer=self.customer, **kwargs)

    def test_status_filter_keeps_only_projects_with_matching_allocations(self):
        result = self._scoped_call(allocation_status=json.dumps(["Confirmed"]))
        self.assertEqual(self._project_ids(result), {self.p_confirmed})
        self.assertEqual(result["total_count"], 1)
        self.assertTrue(self._entry(result, self.p_confirmed)["project_allocations"])

    def test_billable_filter_keeps_only_projects_with_matching_allocations(self):
        billable = self._scoped_call(is_billable="1")
        self.assertEqual(self._project_ids(billable), {self.p_confirmed})
        self.assertEqual(billable["total_count"], 1)

        non_billable = self._scoped_call(is_billable="0")
        self.assertEqual(self._project_ids(non_billable), {self.p_tentative})
        self.assertEqual(non_billable["total_count"], 1)

    def test_no_matching_projects_returns_empty_page(self):
        result = self._scoped_call(is_billable="1", allocation_status=json.dumps(["Tentative"]))
        self.assertEqual(result["data"], [])
        self.assertEqual(result["total_count"], 0)
        self.assertFalse(result["has_more"])

    def test_unfiltered_lists_allocated_projects_before_empty_ones(self):
        result = self._scoped_call()
        ordered = [entry["name"] for entry in result["data"]]
        self.assertEqual(set(ordered), {self.p_confirmed, self.p_tentative, self.p_empty})
        self.assertEqual(result["total_count"], 3)
        self.assertEqual(ordered[-1], self.p_empty)

    def test_unfiltered_pagination_across_partitions(self):
        pages = [self._scoped_call(page_length=1, start=start) for start in range(3)]

        ordered = [entry["name"] for page in pages for entry in page["data"]]
        self.assertEqual(len(ordered), 3)
        self.assertEqual(set(ordered), {self.p_confirmed, self.p_tentative, self.p_empty})
        self.assertEqual(ordered[-1], self.p_empty)

        for page in pages:
            self.assertEqual(page["total_count"], 3)
        self.assertTrue(pages[0]["has_more"])
        self.assertTrue(pages[1]["has_more"])
        self.assertFalse(pages[2]["has_more"])

    def test_unfiltered_boundary_page_spans_both_partitions(self):
        # start=1, page_length=2 straddles the allocated/empty boundary: one allocated
        # project plus p_empty, without duplicates or gaps.
        result = self._scoped_call(page_length=2, start=1)
        ordered = [entry["name"] for entry in result["data"]]
        self.assertEqual(len(ordered), 2)
        self.assertEqual(ordered[-1], self.p_empty)
        self.assertIn(ordered[0], {self.p_confirmed, self.p_tentative})
        self.assertFalse(result["has_more"])
