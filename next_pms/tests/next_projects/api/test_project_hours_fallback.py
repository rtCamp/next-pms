import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, nowdate

from next_pms.next_projects.api.project import get_project_sidebar, get_project_tracking


class TestProjectHoursFallback(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.projects = {}

        employee = frappe.db.get_value("Employee", {"status": "Active"}, "name")
        activity_type = frappe.db.get_value("Activity Type", {}, "name")

        fixtures = {
            "Fixed Cost": (100, 40, 200, 60, 6, 2),
            "Retainer": (80, 25, 150, 55, 4, 3),
            "Time and Material": (999, 888, 120, 30, 5, 1),
            "Non-Billable": (999, 888, 50, 70, 0, 4),
        }
        for index, (billing_type, values) in enumerate(fixtures.items()):
            purchased, remaining, target, actual, billable, non_billable = values
            name = (
                frappe.get_doc(
                    {
                        "doctype": "Project",
                        "project_name": f"HoursFallback {billing_type}",
                        "company": cls.company,
                    }
                )
                .insert(ignore_permissions=True)
                .name
            )
            task = (
                frappe.get_doc(
                    {
                        "doctype": "Task",
                        "subject": f"HoursFallback {billing_type}",
                        "project": name,
                    }
                )
                .insert(ignore_permissions=True)
                .name
            )
            time_logs = [
                {
                    "activity_type": activity_type,
                    "task": task,
                    "hours": hours,
                    "project": name,
                    "is_billable": is_billable,
                    "from_time": f"{add_days(nowdate(), -(2 * index + day))} 09:00:00",
                    "description": f"HoursFallback {billing_type}",
                }
                for day, (hours, is_billable) in enumerate(((billable, 1), (non_billable, 0)), start=1)
                if hours
            ]
            frappe.get_doc(
                {
                    "doctype": "Timesheet",
                    "company": cls.company,
                    "employee": employee,
                    "time_logs": time_logs,
                }
            ).insert(ignore_permissions=True)
            frappe.db.set_value(
                "Project",
                name,
                {
                    "custom_billing_type": billing_type,
                    "custom_total_hours_purchased": purchased,
                    "custom_total_hours_remaining": remaining,
                    "custom_target_hours": target,
                    "actual_time": actual,
                },
                update_modified=False,
            )
            cls.projects[billing_type] = {
                "name": name,
                "purchased": purchased,
                "remaining": remaining,
                "target": target,
                "actual": actual,
                "billable": billable,
                "non_billable": non_billable,
            }

        frappe.set_user("Administrator")

    def test_sidebar_uses_purchased_hours_for_retainer(self):
        fixture = self.projects["Retainer"]
        result = get_project_sidebar(fixture["name"])
        self.assertEqual(result["progress"]["total_hours_purchased"], fixture["purchased"], msg="Retainer")
        self.assertEqual(result["progress"]["actual_time"], fixture["actual"], msg="Retainer")

    def test_sidebar_uses_target_hours_for_non_retainer(self):
        for billing_type in ("Fixed Cost", "Time and Material", "Non-Billable"):
            fixture = self.projects[billing_type]
            result = get_project_sidebar(fixture["name"])
            self.assertEqual(
                result["progress"]["total_hours_purchased"],
                fixture["target"],
                msg=billing_type,
            )

    def test_tracking_splits_utilised_hours_by_billability(self):
        for billing_type, fixture in self.projects.items():
            result = get_project_tracking(fixture["name"])
            self.assertEqual(result["hours_utilised_billable"], fixture["billable"], msg=billing_type)
            self.assertEqual(
                result["hours_utilised_non_billable"],
                fixture["non_billable"],
                msg=billing_type,
            )
            self.assertEqual(
                result["hours_utilised"],
                fixture["billable"] + fixture["non_billable"],
                msg=billing_type,
            )

    def test_tracking_uses_purchased_minus_utilised_for_hours_pool(self):
        for billing_type in ("Fixed Cost", "Retainer"):
            fixture = self.projects[billing_type]
            result = get_project_tracking(fixture["name"])
            self.assertEqual(
                result["hours_remaining"],
                fixture["purchased"] - (fixture["billable"] + fixture["non_billable"]),
                msg=billing_type,
            )

    def test_tracking_falls_back_to_target_minus_utilised_without_hours_pool(self):
        for billing_type in ("Time and Material", "Non-Billable"):
            fixture = self.projects[billing_type]
            result = get_project_tracking(fixture["name"])
            self.assertEqual(
                result["hours_remaining"],
                fixture["target"] - (fixture["billable"] + fixture["non_billable"]),
                msg=billing_type,
            )
