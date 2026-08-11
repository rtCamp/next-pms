import json

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.resource_management.api.team import get_resource_management_team_view_data
from next_pms.timesheet.api.app import has_bu_field


def _business_unit_available():
    """True only when the rtcamp Business Unit doctype + custom_business_unit field exist.

    The Business Unit doctype ships with the rtcamp app, which is not installed in CI,
    so fixtures and assertions that touch it must be skipped there.
    """
    return bool(has_bu_field())


EMPLOYEE_TAGS = {
    "Aarav Sharma": ["python", "react"],
    "Diya Sharma": ["python"],
    "Kabir Sharma": ["python"],
    "Meera Sharma": ["react"],
}

WRITE_USER = "neha.kapoor@example.com"
READ_ONLY_USER = "rohan.verma@example.com"


class TestTeamViewTagFilter(IntegrationTestCase):
    """Tag filtering for get_resource_management_team_view_data.

    Mirrors get_resource_management_project_view_data: a dedicated multi-select `tag`
    param (IN / union) and composite `filters` tag conditions (=, !=, like, not like),
    both resolved against the Tag Link doctype and gated on write permission.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()

        # Projects User grants write permission, so the tag filters take effect.
        cls.write_user = cls._make_user(WRITE_USER)
        frappe.get_doc("User", cls.write_user).add_roles("Projects User")

        cls.employees = {name: cls._make_employee(name, tags) for name, tags in EMPLOYEE_TAGS.items()}

        # The read-only user only passes the endpoint's role gate via the Employee role,
        # which ERPNext grants by linking a User to an Employee. This employee is untagged
        # and has a different surname, so it never appears in the tag/name assertions below.
        cls.read_only_user = cls._make_user(READ_ONLY_USER)
        cls._make_employee("Rohan Verma", [], user_id=cls.read_only_user)

        frappe.clear_cache()

    @classmethod
    def _make_user(cls, email):
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
        return email

    @classmethod
    def _make_employee(cls, employee_name, tags, user_id=None):
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
                # when leave_approver is empty, calling a str-typed helper that rejects a
                # None reports_to. Setting it up front skips that branch.
                "leave_approver": "Administrator",
                "user_id": user_id,
            }
        )
        employee.insert(ignore_permissions=True)
        for tag in tags:
            employee.add_tag(tag)
        return employee.name

    def tearDown(self):
        frappe.set_user("Administrator")

    def _team_view_employee_names(self, user=WRITE_USER, **kwargs):
        frappe.set_user(user)
        result = get_resource_management_team_view_data(date="2026-06-14", **kwargs)
        names = sorted(employee["employee_name"] for employee in result["employees"])
        return names, result["total_count"], result["permissions"]

    def test_dedicated_tag_param_returns_employees_with_that_tag(self):
        names, total_count, _permissions = self._team_view_employee_names(tag=json.dumps(["python"]))
        self.assertEqual(names, ["Aarav Sharma", "Diya Sharma", "Kabir Sharma"])
        self.assertEqual(total_count, 3)

    def test_dedicated_tag_param_with_multiple_tags_unions_membership(self):
        names, total_count, _permissions = self._team_view_employee_names(tag=json.dumps(["python", "react"]))
        self.assertEqual(names, ["Aarav Sharma", "Diya Sharma", "Kabir Sharma", "Meera Sharma"])
        self.assertEqual(total_count, 4)

    def test_composite_filter_tag_equals(self):
        names, total_count, _permissions = self._team_view_employee_names(filters=json.dumps([["tag", "=", "python"]]))
        self.assertEqual(names, ["Aarav Sharma", "Diya Sharma", "Kabir Sharma"])
        self.assertEqual(total_count, 3)

    def test_composite_filter_tag_conditions_are_anded(self):
        names, total_count, _permissions = self._team_view_employee_names(
            filters=json.dumps([["tag", "=", "python"], ["tag", "=", "react"]])
        )
        self.assertEqual(names, ["Aarav Sharma"])
        self.assertEqual(total_count, 1)

    def test_composite_filter_tag_with_employee_name(self):
        names, total_count, _permissions = self._team_view_employee_names(
            filters=json.dumps([["tag", "=", "python"], ["employee_name", "like", "Diya"]])
        )
        self.assertEqual(names, ["Diya Sharma"])
        self.assertEqual(total_count, 1)

    def test_composite_filter_tag_like(self):
        names, total_count, _permissions = self._team_view_employee_names(filters=json.dumps([["tag", "like", "reac"]]))
        self.assertEqual(names, ["Aarav Sharma", "Meera Sharma"])
        self.assertEqual(total_count, 2)

    def test_composite_filter_tag_not_equals_excludes_tagged(self):
        names, total_count, _permissions = self._team_view_employee_names(
            filters=json.dumps([["tag", "!=", "python"], ["employee_name", "like", "Sharma"]])
        )
        self.assertEqual(names, ["Meera Sharma"])
        self.assertEqual(total_count, 1)

    def test_dedicated_param_and_composite_filter_stack(self):
        names, total_count, _permissions = self._team_view_employee_names(
            tag=json.dumps(["python"]),
            filters=json.dumps([["tag", "=", "react"]]),
        )
        self.assertEqual(names, ["Aarav Sharma"])
        self.assertEqual(total_count, 1)

    def test_tag_filter_ignored_without_write_permission(self):
        names, total_count, permissions = self._team_view_employee_names(
            user=READ_ONLY_USER,
            tag=json.dumps(["python"]),
            filters=json.dumps([["employee_name", "like", "Sharma"]]),
        )
        self.assertFalse(permissions["write"])
        self.assertEqual(names, ["Aarav Sharma", "Diya Sharma", "Kabir Sharma", "Meera Sharma"])
        self.assertEqual(total_count, 4)


# A Monday, so the derived window is [2026-06-15, 2026-06-28] for max_week=2.
TEAM_DATE = "2026-06-15"
TEAM_WINDOW_START = "2026-06-15"

FILTER_WRITE_USER = "tv.write@example.com"
FILTER_READ_ONLY_USER = "tv.readonly@example.com"


class _TeamViewBase(IntegrationTestCase):
    """Shared fixture factories for the team-view filter tests.

    Filter assertions run as a write user (Projects User role); the endpoint blanks every
    filter except employee_name for non-write callers.
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
    def _make_master(cls, doctype, name_field, name):
        if not frappe.db.exists(doctype, name):
            frappe.get_doc({"doctype": doctype, name_field: name}).insert(ignore_permissions=True)
        return name

    @classmethod
    def _make_employee(
        cls,
        employee_name,
        user_id=None,
        designation=None,
        business_unit=None,
        reports_to=None,
        skills=(),
    ):
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
                "leave_approver": "Administrator",
                "user_id": user_id,
                "designation": designation,
                "custom_business_unit": business_unit,
                "reports_to": reports_to,
            }
        )
        employee.insert(ignore_permissions=True)
        if skills:
            # Employee Skill Map is named by employee, so its Employee Skill children carry
            # the employee id as their parent — which is what get_employees_by_skills reads.
            for skill_name, _ in skills:
                cls._make_master("Skill", "skill_name", skill_name)
            frappe.get_doc(
                {
                    "doctype": "Employee Skill Map",
                    "employee": employee.name,
                    "employee_skills": [
                        {"skill": skill_name, "proficiency": proficiency} for skill_name, proficiency in skills
                    ],
                }
            ).insert(ignore_permissions=True)
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
    def _make_project(cls, project_name, customer):
        return (
            frappe.get_doc(
                {
                    "doctype": "Project",
                    "project_name": project_name,
                    "company": cls.company,
                    "customer": customer,
                    "custom_billing_type": "Non-Billable",
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

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

    def _call(self, user=FILTER_WRITE_USER, **kwargs):
        frappe.set_user(user)
        return get_resource_management_team_view_data(date=TEAM_DATE, **kwargs)

    def _names(self, result):
        return sorted(employee["employee_name"] for employee in result["employees"])


class TestTeamViewEmployeeFilters(_TeamViewBase):
    """Which employees the team view returns — filter_employees + skill/id resolution."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.write_user = cls._make_user(FILTER_WRITE_USER, projects_user=True)
        cls.read_only_user = cls._make_user(FILTER_READ_ONLY_USER)
        # Read-only employee is not "Tvf"-named, so it never appears in the scoped assertions.
        cls._make_employee("Tv Readonly", user_id=cls.read_only_user)

        cls.has_business_unit = _business_unit_available()
        if cls.has_business_unit:
            cls.bu_alpha = cls._make_master("Business Unit", "business_unit_name", "Tvf BU Alpha")
            cls.bu_beta = cls._make_master("Business Unit", "business_unit_name", "Tvf BU Beta")
        else:
            cls.bu_alpha = cls.bu_beta = None
        cls.desig_alpha = cls._make_master("Designation", "designation_name", "Tvf Desig Alpha")
        cls.desig_beta = cls._make_master("Designation", "designation_name", "Tvf Desig Beta")

        cls.mgr = cls._make_employee("Tvf Mgr", designation=cls.desig_beta, business_unit=cls.bu_beta)
        cls.alpha = cls._make_employee(
            "Tvf Alpha", designation=cls.desig_alpha, business_unit=cls.bu_alpha, skills=[("TvfPython", 0.8)]
        )
        cls.beta = cls._make_employee(
            "Tvf Beta",
            designation=cls.desig_beta,
            business_unit=cls.bu_beta,
            reports_to=cls.mgr,
            skills=[("TvfReact", 0.7)],
        )
        cls.gamma = cls._make_employee(
            "Tvf Gamma",
            designation=cls.desig_alpha,
            business_unit=cls.bu_alpha,
            reports_to=cls.mgr,
            skills=[("TvfPython", 0.6), ("TvfReact", 0.9)],
        )

        frappe.clear_cache()

    def test_employee_name_like(self):
        result = self._call(employee_name="Tvf Alpha")
        self.assertEqual(self._names(result), ["Tvf Alpha"])

    def test_designation(self):
        result = self._call(employee_name="Tvf", designation=json.dumps([self.desig_alpha]))
        self.assertEqual(self._names(result), ["Tvf Alpha", "Tvf Gamma"])

    def test_business_unit(self):
        if not self.has_business_unit:
            self.skipTest("Business Unit doctype / custom_business_unit field not installed")
        result = self._call(employee_name="Tvf", business_unit=json.dumps([self.bu_beta]))
        self.assertEqual(self._names(result), ["Tvf Beta", "Tvf Mgr"])

    def test_reports_to(self):
        result = self._call(employee_name="Tvf", reports_to=json.dumps([self.mgr]))
        self.assertEqual(self._names(result), ["Tvf Beta", "Tvf Gamma"])

    def test_employee_id(self):
        result = self._call(employee_id=json.dumps([self.alpha, self.beta]))
        self.assertEqual(self._names(result), ["Tvf Alpha", "Tvf Beta"])

    def test_employee_id_takes_priority_over_skills(self):
        result = self._call(
            employee_id=json.dumps([self.alpha]),
            skills=json.dumps([{"name": "TvfPython", "operator": ">=", "proficiency": 0.5}]),
        )
        self.assertEqual(self._names(result), ["Tvf Alpha"])

    def test_skills_param(self):
        result = self._call(
            employee_name="Tvf",
            skills=json.dumps([{"name": "TvfReact", "operator": ">=", "proficiency": 0.5}]),
        )
        self.assertEqual(self._names(result), ["Tvf Beta", "Tvf Gamma"])

    def test_composite_filter_designation_operators(self):
        eq = self._call(filters=json.dumps([["designation", "=", self.desig_alpha], ["employee_name", "like", "Tvf"]]))
        self.assertEqual(self._names(eq), ["Tvf Alpha", "Tvf Gamma"])

        neq = self._call(
            filters=json.dumps([["designation", "!=", self.desig_alpha], ["employee_name", "like", "Tvf"]])
        )
        self.assertEqual(self._names(neq), ["Tvf Beta", "Tvf Mgr"])

    def test_composite_filter_skills(self):
        result = self._call(filters=json.dumps([["skills", "=", "TvfPython"], ["employee_name", "like", "Tvf"]]))
        self.assertEqual(self._names(result), ["Tvf Alpha", "Tvf Gamma"])

    def test_pagination(self):
        page1 = self._call(employee_name="Tvf", page_length=2, start=0)
        self.assertEqual(len(page1["employees"]), 2)
        self.assertEqual(page1["total_count"], 4)
        self.assertTrue(page1["has_more"])

        page2 = self._call(employee_name="Tvf", page_length=2, start=2)
        self.assertEqual(len(page2["employees"]), 2)
        self.assertEqual(page2["total_count"], 4)
        self.assertFalse(page2["has_more"])

    def test_non_write_user_ignores_filters_except_name(self):
        # business_unit=[bu_alpha] would drop Beta/Mgr if honored; a read-only caller must
        # ignore it and return all four Tvf employees via the name filter.
        if not self.has_business_unit:
            self.skipTest("Business Unit doctype / custom_business_unit field not installed")
        result = self._call(user=FILTER_READ_ONLY_USER, employee_name="Tvf", business_unit=json.dumps([self.bu_alpha]))
        self.assertFalse(result["permissions"]["write"])
        self.assertEqual(self._names(result), ["Tvf Alpha", "Tvf Beta", "Tvf Gamma", "Tvf Mgr"])


class TestTeamViewAllocationFilters(_TeamViewBase):
    """Allocation-driven narrowing — is_billable / allocation_status / date window.

    These narrow the employee set to those with a matching in-window allocation before
    pagination (team.py). Employee sets are scoped with employee_id for determinism.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.write_user = cls._make_user(FILTER_WRITE_USER, projects_user=True)
        cls.customer = cls._make_customer("TV Alloc Customer")
        cls.project = cls._make_project("TV Alloc Portal", cls.customer)

        cls.emp_billable = cls._make_employee("Tva Billable")
        cls.emp_nonbillable = cls._make_employee("Tva Nonbillable")
        cls.emp_out = cls._make_employee("Tva OutOfWindow")

        cls._make_allocation(
            cls.emp_billable, cls.project, TEAM_WINDOW_START, "2026-06-19", is_billable=1, status="Confirmed"
        )
        cls._make_allocation(
            cls.emp_nonbillable, cls.project, "2026-06-16", "2026-06-20", is_billable=0, status="Tentative"
        )
        # Billable but entirely after the window — must not qualify the employee.
        cls._make_allocation(cls.emp_out, cls.project, "2026-07-01", "2026-07-05", is_billable=1, status="Confirmed")

        cls.all_ids = json.dumps([cls.emp_billable, cls.emp_nonbillable, cls.emp_out])
        frappe.clear_cache()

    def test_is_billable_one_only_in_window(self):
        result = self._call(employee_id=self.all_ids, is_billable=json.dumps([1]))
        self.assertEqual(self._names(result), ["Tva Billable"])

    def test_is_billable_zero_is_honored(self):
        # A [0] filter must narrow to non-billable, not be treated as "no filter".
        result = self._call(employee_id=self.all_ids, is_billable=json.dumps([0]))
        self.assertEqual(self._names(result), ["Tva Nonbillable"])

    def test_allocation_status_filter(self):
        confirmed = self._call(employee_id=self.all_ids, allocation_status=json.dumps(["Tentative"]))
        self.assertEqual(self._names(confirmed), ["Tva Nonbillable"])

    def test_both_billable_values_select_every_allocated_employee(self):
        # Selecting both billable options means "either kind of allocation", which is not
        # the same as leaving the axis unfiltered — the out-of-window employee stays out.
        result = self._call(employee_id=self.all_ids, is_billable=json.dumps([0, 1]))
        self.assertEqual(self._names(result), ["Tva Billable", "Tva Nonbillable"])

    def test_both_status_values_select_every_allocated_employee(self):
        result = self._call(employee_id=self.all_ids, allocation_status=json.dumps(["Confirmed", "Tentative"]))
        self.assertEqual(self._names(result), ["Tva Billable", "Tva Nonbillable"])

    def test_no_matching_allocation_returns_empty(self):
        result = self._call(employee_id=json.dumps([self.emp_nonbillable]), is_billable=json.dumps([1]))
        self.assertEqual(result["employees"], [])
        self.assertEqual(result["total_count"], 0)
        self.assertFalse(result["has_more"])


class TestTeamViewNoAllocationFilter(_TeamViewBase):
    """`no_allocation` — an independent leg of the allocation-type multi-select.

    It unions with is_billable / allocation_status rather than inverting them: the result
    is the employees matching those options PLUS the employees with zero in-window
    allocations. "No allocation" always means zero allocations of any kind. Employee sets
    are scoped with employee_id for determinism.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.write_user = cls._make_user(FILTER_WRITE_USER, projects_user=True)
        cls.read_only_user = cls._make_user(FILTER_READ_ONLY_USER)
        if not frappe.db.exists("Employee", {"user_id": cls.read_only_user}):
            # The endpoint gates on the Employee role, which comes from a linked Employee.
            # Not "Tna"-named, so it never appears in the scoped assertions.
            cls._make_employee("Tv NoAlloc Readonly", user_id=cls.read_only_user)
        cls.customer = cls._make_customer("TV NoAlloc Customer")
        cls.project = cls._make_project("TV NoAlloc Portal", cls.customer)

        cls.emp_billable = cls._make_employee("Tna Billable")
        cls.emp_nonbillable = cls._make_employee("Tna Nonbillable")
        cls.emp_out = cls._make_employee("Tna OutOfWindow")
        cls.emp_free = cls._make_employee("Tna Free")
        cls.emp_mixed = cls._make_employee("Tna Mixed")

        cls._make_allocation(
            cls.emp_billable, cls.project, TEAM_WINDOW_START, "2026-06-19", is_billable=1, status="Confirmed"
        )
        cls._make_allocation(
            cls.emp_nonbillable, cls.project, "2026-06-16", "2026-06-20", is_billable=0, status="Tentative"
        )
        # Allocated, but entirely after the window — counts as unallocated for this range.
        cls._make_allocation(cls.emp_out, cls.project, "2026-07-01", "2026-07-05", is_billable=1, status="Confirmed")
        # Holds one allocation of each kind, so it is matched by either billable option and
        # must never be dropped merely for holding a non-matching allocation too. The two
        # must not overlap — Resource Allocation rejects overlaps on the same project.
        cls._make_allocation(
            cls.emp_mixed, cls.project, TEAM_WINDOW_START, "2026-06-17", is_billable=1, status="Confirmed"
        )
        cls._make_allocation(cls.emp_mixed, cls.project, "2026-06-22", "2026-06-24", is_billable=0, status="Tentative")

        cls.all_ids = json.dumps([cls.emp_billable, cls.emp_nonbillable, cls.emp_out, cls.emp_free])
        cls.allocated_ids = json.dumps([cls.emp_billable, cls.emp_nonbillable])
        cls.mixed_ids = json.dumps([cls.emp_mixed, cls.emp_billable, cls.emp_free])
        frappe.clear_cache()

    def test_alone_returns_only_employees_without_any_allocation(self):
        result = self._call(employee_id=self.all_ids, no_allocation=True)
        self.assertEqual(self._names(result), ["Tna Free", "Tna OutOfWindow"])

    def test_unions_with_is_billable(self):
        # "No allocation" + "Billable only" — the billable employee plus the unallocated.
        result = self._call(employee_id=self.all_ids, no_allocation=True, is_billable=json.dumps([1]))
        self.assertEqual(self._names(result), ["Tna Billable", "Tna Free", "Tna OutOfWindow"])

    def test_unions_with_non_billable(self):
        result = self._call(employee_id=self.all_ids, no_allocation=True, is_billable=json.dumps([0]))
        self.assertEqual(self._names(result), ["Tna Free", "Tna Nonbillable", "Tna OutOfWindow"])

    def test_allocation_status_is_dropped_without_a_billability_option(self):
        # An unallocated employee has no allocation to be Confirmed, so the status axis
        # cannot narrow anything here and must not union in the confirmed employees.
        result = self._call(employee_id=self.all_ids, no_allocation=True, allocation_status=json.dumps(["Confirmed"]))
        self.assertEqual(self._names(result), ["Tna Free", "Tna OutOfWindow"])

    def test_allocation_status_applies_alongside_a_billability_option(self):
        # With a presence option selected the status axis is meaningful again: it narrows
        # the billable leg, and the no-allocation leg unions on top.
        result = self._call(
            employee_id=self.all_ids,
            no_allocation=True,
            is_billable=json.dumps([1]),
            allocation_status=json.dumps(["Confirmed"]),
        )
        self.assertEqual(self._names(result), ["Tna Billable", "Tna Free", "Tna OutOfWindow"])

    def test_employee_matching_on_one_of_several_allocations_is_kept(self):
        # Tna Mixed holds both a billable and a non-billable allocation. Either option must
        # match it — holding a *non*-matching allocation is not grounds for exclusion.
        billable = self._call(employee_id=self.mixed_ids, no_allocation=True, is_billable=json.dumps([1]))
        self.assertEqual(self._names(billable), ["Tna Billable", "Tna Free", "Tna Mixed"])

        non_billable = self._call(employee_id=self.mixed_ids, no_allocation=True, is_billable=json.dumps([0]))
        self.assertEqual(self._names(non_billable), ["Tna Free", "Tna Mixed"])

    def test_combines_with_employee_name(self):
        result = self._call(employee_id=self.all_ids, no_allocation=True, employee_name="Free")
        self.assertEqual(self._names(result), ["Tna Free"])

    def test_all_scoped_employees_allocated_returns_empty(self):
        result = self._call(employee_id=self.allocated_ids, no_allocation=True)
        self.assertEqual(result["employees"], [])
        self.assertEqual(result["total_count"], 0)
        self.assertFalse(result["has_more"])

    def test_empty_match_set_returns_only_the_unallocated(self):
        # Nobody in this set has a *billable Tentative* allocation, so the union collapses
        # to its no-allocation leg — and must not fall into the empty-response branch.
        result = self._call(
            employee_id=self.all_ids,
            no_allocation=True,
            is_billable=json.dumps([1]),
            allocation_status=json.dumps(["Tentative"]),
        )
        self.assertEqual(self._names(result), ["Tna Free", "Tna OutOfWindow"])

    def test_pagination_counts_the_filtered_set(self):
        result = self._call(employee_id=self.all_ids, no_allocation=True, page_length=1)
        self.assertEqual(self._names(result), ["Tna Free"])
        self.assertEqual(result["total_count"], 2)
        self.assertTrue(result["has_more"])

    def test_ignored_without_write_permission(self):
        # no_allocation would drop the allocated employees if honored; a read-only caller
        # must ignore it and return every Tna employee via the name filter.
        result = self._call(user=FILTER_READ_ONLY_USER, employee_name="Tna", no_allocation=True)
        self.assertFalse(result["permissions"]["write"])
        self.assertEqual(
            self._names(result),
            ["Tna Billable", "Tna Free", "Tna Mixed", "Tna Nonbillable", "Tna OutOfWindow"],
        )


class TestTeamViewHoursSummaryShape(_TeamViewBase):
    """The need_hours_summary response-shape switch."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.write_user = cls._make_user(FILTER_WRITE_USER, projects_user=True)
        cls.customer = cls._make_customer("TV Hours Customer")
        cls.project = cls._make_project("TV Hours Portal", cls.customer)
        cls.employee = cls._make_employee("Tvh Employee")
        # In-window allocation ([2026-06-15, 2026-06-28]) and one entirely after it.
        cls.in_window_alloc = cls._make_allocation(
            cls.employee, cls.project, TEAM_WINDOW_START, "2026-06-19", is_billable=1
        )
        cls.out_of_window_alloc = cls._make_allocation(
            cls.employee, cls.project, "2026-07-01", "2026-07-05", is_billable=1
        )
        cls.only = json.dumps([cls.employee])
        frappe.clear_cache()

    def test_flat_grid_shape(self):
        result = self._call(employee_id=self.only, need_hours_summary=False)
        for key in (
            "employees",
            "resource_allocations",
            "leaves",
            "customer",
            "total_count",
            "has_more",
            "permissions",
        ):
            self.assertIn(key, result)
        self.assertNotIn("data", result)

    def test_flat_grid_excludes_out_of_window_allocations(self):
        # #1677 regression: the flat grid must only return allocations overlapping the
        # derived window, not every allocation for the employee ("fetch all weeks").
        result = self._call(employee_id=self.only, need_hours_summary=False)
        alloc_names = {allocation["name"] for allocation in result["resource_allocations"]}
        self.assertIn(self.in_window_alloc, alloc_names)
        self.assertNotIn(self.out_of_window_alloc, alloc_names)

    def test_hours_summary_shape(self):
        result = self._call(employee_id=self.only, need_hours_summary=True)
        for key in ("data", "customer", "total_count", "has_more", "permissions"):
            self.assertIn(key, result)
        entry = next(row for row in result["data"] if row["name"] == self.employee)
        self.assertIn("all_dates_data", entry)
        self.assertIn("all_week_data", entry)
