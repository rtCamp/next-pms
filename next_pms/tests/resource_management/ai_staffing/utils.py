from contextlib import contextmanager
from datetime import date
from unittest.mock import patch

import frappe
from erpnext import get_default_company

ORGANIZATION = "AI Staffing Test Org"
STAGE = "AI Staffing Test Stage"
START = date(2027, 3, 1)
LAUNCH = date(2027, 4, 26)


def make_organization(name: str = ORGANIZATION) -> str:
    if not frappe.db.exists("CRM Organization", name):
        frappe.get_doc({"doctype": "CRM Organization", "organization_name": name}).insert(ignore_permissions=True)
    return name


def make_deal(organization: str = ORGANIZATION, **values) -> str:
    deal = frappe.get_doc(
        {
            "doctype": "CRM Deal",
            "organization": make_organization(organization),
            "company": get_default_company(),
            "currency": "USD",
            "expected_deal_value": 48000,
            "custom_expected_start_date": START,
            "custom_handover_sheet_link": "https://docs.google.com/spreadsheets/d/ai-staffing-test/edit",
            **values,
        }
    )
    return deal.insert(ignore_permissions=True).name


def make_staff(first_name: str, designation: str, skills: tuple[str, ...] = ()) -> str:
    if not frappe.db.exists("Designation", designation):
        frappe.get_doc({"doctype": "Designation", "designation_name": designation}).insert(ignore_permissions=True)
    email = f"{first_name.lower().replace(' ', '.')}@ai-staffing.example.com"
    employee = frappe.db.get_value("Employee", {"company_email": email})
    if not employee:
        employee = (
            frappe.get_doc(
                {
                    "doctype": "Employee",
                    "naming_series": "EMP-",
                    "first_name": first_name,
                    "company": get_default_company(),
                    "gender": "Female",
                    "date_of_birth": "1990-05-08",
                    "date_of_joining": "2013-01-01",
                    "status": "Active",
                    "employment_type": "Intern",
                    "company_email": email,
                    "designation": designation,
                    "ctc": 1200000,
                    "salary_currency": "INR",
                }
            )
            .insert(ignore_permissions=True)
            .name
        )
    for skill in skills:
        if not frappe.db.exists("Skill", skill):
            frappe.get_doc({"doctype": "Skill", "skill_name": skill}).insert(ignore_permissions=True)
    if skills and not frappe.db.exists("Employee Skill Map", employee):
        frappe.get_doc(
            {
                "doctype": "Employee Skill Map",
                "employee": employee,
                "employee_skills": [{"skill": skill, "proficiency": 4} for skill in skills],
            }
        ).insert(ignore_permissions=True)
    return employee


def sow_tabs(roles: dict[str, tuple[str, str]]) -> dict[str, list[list[str]]]:
    """Sheet tabs in the SOW template's layout. `roles` maps a role column to (hours/day, members)."""
    return {
        "Delivery-Comprehensive Estimate": [
            ["Task", *roles],
            ["Hours Per Day Per Individual", *(hours for hours, _ in roles.values())],
            ["Number of Team Members", *(members for _, members in roles.values())],
            ["Start Date", "", START.strftime("%m/%d/%Y")],
            ["Launch Date", "", LAUNCH.strftime("%m/%d/%Y")],
            ["PROJECT TOTAL HOURS", "480"],
        ],
        "Sales-Estimation Summary": [
            ["Component", "", "Hours", "Cost (USD)", "Total Cost (USD)"],
            ["TOTAL", "", "480", "", "$48,000"],
        ],
        "Sales-Timeline": [],
    }


@contextmanager
def mocked_sheet(tabs: dict[str, list[list[str]]] | Exception):
    def get_values(sheet_id: str, tab: str) -> list[list[str]]:
        if isinstance(tabs, Exception):
            raise tabs
        return tabs[tab]

    with patch("next_pms.resource_management.ai_staffing.google_sheets.get_values", side_effect=get_values):
        yield


@contextmanager
def transaction_kept_open():
    """The pipeline commits between steps and rolls back on failure. Keep the test's own
    transaction open instead: commits do nothing, a rollback undoes only the pipeline's work."""
    rollback = frappe.db.rollback
    frappe.db.savepoint("ai_staffing_test")
    with (
        patch.object(frappe.db, "commit"),
        patch.object(frappe.db, "rollback", lambda *args, **kwargs: rollback(save_point="ai_staffing_test")),
    ):
        yield
