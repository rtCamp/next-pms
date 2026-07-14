import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.next_projects.api.project import get_project_sidebar, get_project_tracking


class TestProjectHoursFallback(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.projects = {}

        fixtures = {
            "Fixed Cost": (100, 40, 200, 60),
            "Retainer": (80, 25, 150, 55),
            "Time and Material": (999, 888, 120, 30),
            "Non-Billable": (999, 888, 50, 70),
        }
        for billing_type, (purchased, remaining, target, actual) in fixtures.items():
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
            }

        frappe.set_user("Administrator")

    def test_sidebar_uses_purchased_hours_for_hours_pool(self):
        for billing_type in ("Fixed Cost", "Retainer"):
            fixture = self.projects[billing_type]
            result = get_project_sidebar(fixture["name"])
            self.assertEqual(
                result["progress"]["total_hours_purchased"],
                fixture["purchased"],
                msg=billing_type,
            )
            self.assertEqual(result["progress"]["actual_time"], fixture["actual"], msg=billing_type)

    def test_sidebar_falls_back_to_target_hours_without_hours_pool(self):
        for billing_type in ("Time and Material", "Non-Billable"):
            fixture = self.projects[billing_type]
            result = get_project_sidebar(fixture["name"])
            self.assertEqual(
                result["progress"]["total_hours_purchased"],
                fixture["target"],
                msg=billing_type,
            )

    def test_tracking_uses_remaining_hours_for_hours_pool(self):
        for billing_type in ("Fixed Cost", "Retainer"):
            fixture = self.projects[billing_type]
            result = get_project_tracking(fixture["name"])
            self.assertEqual(result["hours_remaining"], fixture["remaining"], msg=billing_type)
            self.assertEqual(result["hours_utilised"], fixture["actual"], msg=billing_type)

    def test_tracking_falls_back_to_target_minus_actual_without_hours_pool(self):
        for billing_type in ("Time and Material", "Non-Billable"):
            fixture = self.projects[billing_type]
            result = get_project_tracking(fixture["name"])
            self.assertEqual(
                result["hours_remaining"],
                fixture["target"] - fixture["actual"],
                msg=billing_type,
            )
