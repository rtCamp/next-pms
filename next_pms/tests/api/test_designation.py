# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.api.designation import get_designations

# Every fixture designation carries one of these prefixes so the assertions can scope
# themselves with `search` and stay immune to whatever designations the site already has.
PREFIX = "DsgTest"
PCT_PREFIX = "DsgPct"
UND_PREFIX = "DsgUnd"

ALPHA = f"{PREFIX} Alpha"
BETA = f"{PREFIX} Beta"
GAMMA = f"{PREFIX} Gamma"
DELTA = f"{PREFIX} Delta"
EMPTY = f"{PREFIX} Empty"
DEPARTED = f"{PREFIX} Departed"

PCT_LITERAL = f"{PCT_PREFIX} 100% Bonus"
PCT_DECOY = f"{PCT_PREFIX} 100X Bonus"
UND_LITERAL = f"{UND_PREFIX} A_B"
UND_DECOY = f"{UND_PREFIX} AXB"

# Active-employee counts descending, name ascending — the order the endpoint must produce.
EXPECTED_ORDER = [ALPHA, BETA, GAMMA, DELTA]


class TestGetDesignations(IntegrationTestCase):
    """Cover ranking, exclusion, search and pagination on next_pms.api.designation.

    Fixtures are built once in setUpClass; IntegrationTestCase rolls the whole class's
    DB writes back on class teardown, so nothing leaks into the site.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()

        for designation in (
            ALPHA,
            BETA,
            GAMMA,
            DELTA,
            EMPTY,
            DEPARTED,
            PCT_LITERAL,
            PCT_DECOY,
            UND_LITERAL,
            UND_DECOY,
        ):
            cls._make_designation(designation)

        for index in range(3):
            cls._make_employee(f"DsgAlpha{index}", designation=ALPHA)
        for index in range(2):
            cls._make_employee(f"DsgBeta{index}", designation=BETA)
        for index in range(2):
            cls._make_employee(f"DsgGamma{index}", designation=GAMMA)
        cls._make_employee("DsgDelta0", designation=DELTA)

        cls._make_employee("DsgPctLiteral", designation=PCT_LITERAL)
        cls._make_employee("DsgPctDecoy", designation=PCT_DECOY)
        cls._make_employee("DsgUndLiteral", designation=UND_LITERAL)
        cls._make_employee("DsgUndDecoy", designation=UND_DECOY)

        # EMPTY gets no employee at all; DEPARTED only gets employees who are gone.
        cls._make_employee("DsgDeparted0", designation=DEPARTED, status="Inactive")
        cls._make_employee("DsgDeparted1", designation=DEPARTED, status="Left", relieving_date="2025-01-31")

        cls._make_employee("DsgNoDesignation", designation=None)

    @classmethod
    def _make_designation(cls, designation_name):
        if not frappe.db.exists("Designation", designation_name):
            frappe.get_doc({"doctype": "Designation", "designation_name": designation_name}).insert(
                ignore_permissions=True
            )
        return designation_name

    @classmethod
    def _make_employee(cls, employee_name, designation=None, status="Active", relieving_date=None):
        employee = frappe.new_doc("Employee")
        employee.update(
            {
                "naming_series": "EMP-",
                "first_name": employee_name,
                "company": cls.company,
                "gender": "Female",
                "date_of_birth": "1990-05-08",
                "date_of_joining": "2013-01-01",
                "status": status,
                "employment_type": "Intern",
                "leave_approver": "Administrator",
                "designation": designation,
                "relieving_date": relieving_date,
            }
        )
        employee.insert(ignore_permissions=True)
        return employee.name

    def _names(self, **kwargs):
        return [row["name"] for row in get_designations(**kwargs)]

    def test_ranks_by_active_employee_count(self):
        self.assertEqual(self._names(search=PREFIX, page_length=50), EXPECTED_ORDER)

    def test_returns_only_the_name_key(self):
        """The dropdown consumes the frappe.client.get_list shape — name and nothing else."""
        rows = get_designations(search=PREFIX, page_length=50)
        self.assertTrue(all(set(row) == {"name"} for row in rows))

    def test_alphabetical_tiebreak_on_equal_counts(self):
        names = self._names(search=PREFIX, page_length=50)
        self.assertLess(names.index(BETA), names.index(GAMMA))

    def test_designation_with_no_employees_is_excluded(self):
        self.assertNotIn(EMPTY, self._names(search=PREFIX, page_length=50))

    def test_inactive_employees_do_not_count(self):
        self.assertNotIn(DEPARTED, self._names(search=PREFIX, page_length=50))

    def test_blank_designation_is_not_returned(self):
        self.assertTrue(all(row["name"] for row in get_designations(page_length=100)))

    def test_search_filters_by_substring(self):
        self.assertEqual(self._names(search="dsgtest alph"), [ALPHA])
        self.assertEqual(self._names(search="GAMMA"), [GAMMA])

    def test_blank_search_is_ignored(self):
        self.assertEqual(self._names(search="   ", page_length=100), self._names(page_length=100))

    def test_search_escapes_percent_wildcard(self):
        self.assertEqual(sorted(self._names(search=PCT_PREFIX)), sorted([PCT_LITERAL, PCT_DECOY]))
        self.assertEqual(self._names(search="100%"), [PCT_LITERAL])

    def test_search_escapes_underscore_wildcard(self):
        self.assertEqual(sorted(self._names(search=UND_PREFIX)), sorted([UND_LITERAL, UND_DECOY]))
        self.assertEqual(self._names(search="A_B"), [UND_LITERAL])

    def test_search_no_match_returns_empty_list(self):
        self.assertEqual(get_designations(search=f"{PREFIX} Nonexistent"), [])

    def test_pagination_pages_without_overlap(self):
        self.assertEqual(self._names(search=PREFIX, page_length=2, start=0), EXPECTED_ORDER[:2])
        self.assertEqual(self._names(search=PREFIX, page_length=2, start=2), EXPECTED_ORDER[2:])

    def test_start_beyond_last_row_returns_empty_list(self):
        self.assertEqual(get_designations(search=PREFIX, page_length=2, start=10), [])

    def test_page_length_and_start_are_clamped(self):
        self.assertEqual(self._names(search=PREFIX, page_length="2"), EXPECTED_ORDER[:2])
        self.assertEqual(self._names(search=PREFIX, start="2", page_length=50), EXPECTED_ORDER[2:])
        self.assertEqual(self._names(search=PREFIX, page_length=0), EXPECTED_ORDER[:1])
        self.assertEqual(self._names(search=PREFIX, page_length=-5), EXPECTED_ORDER[:1])
        self.assertEqual(self._names(search=PREFIX, page_length=1000), EXPECTED_ORDER)
        self.assertEqual(self._names(search=PREFIX, start=-5, page_length=50), EXPECTED_ORDER)

    def test_non_numeric_pagination_params_are_rejected(self):
        """Frappe's whitelist layer coerces "2" but throws on junk, before the endpoint runs."""
        with self.assertRaises(frappe.exceptions.FrappeTypeError):
            get_designations(search=PREFIX, page_length="abc")
