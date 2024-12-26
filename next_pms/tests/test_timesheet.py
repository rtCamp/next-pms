import unittest

import frappe
from frappe.utils import add_days, nowdate

from next_pms.tests import TestNextPms

unittest.TestLoader.sortTestMethodsUsing = None


class TestTimesheet(TestNextPms):
    def setUp(self):
        super().setUp()
        self.login_as_user("next-employee@example.com")
        self.employee = self.get_login_employee()
        self.task = frappe.db.get_value("Task", {"subject": "Task 1"}, "name")

    def test_a_timesheet_creation(self):
        method = self.method("next_pms.timesheet.api.timesheet.save")

        data = {
            "date": nowdate(),
            "employee": self.employee,
            "description": "This is test timesheet",
            "task": self.task,
            "hours": 1,
        }
        response = self.post(method, data)
        self.assertEqual(response.status_code, 200)

        data = {
            "date": add_days(nowdate(), -1),
            "employee": self.employee,
            "description": "This is test timesheet",
            "task": self.task,
            "hours": 1,
        }
        response = self.post(method, data)
        self.assertEqual(response.status_code, 200)

    def test_b_timesheet_data(self):
        params = {
            "employee": self.employee,
            "start_date": nowdate(),
            "max_week": 4,
        }

        response = self.get(
            self.method("next_pms.timesheet.api.timesheet.get_timesheet_data"),
            params=params,
        )
        self.assertEqual(response.status_code, 200)
        res = response.json.get("message")
        self.assertTrue(res.get("working_hour"), 8)

    def test_c_timesheet_update(self):
        """Test timesheet update"""

        def get_timesheet_details(self: TestTimesheet):
            # First get the timesheet data for update
            method = self.method("next_pms.timesheet.api.timesheet.get_timesheet_details")
            params = {"employee": self.employee, "date": nowdate(), "task": self.task}
            response = self.get(method, params)
            self.assertEqual(response.status_code, 200)
            timesheet = response.json.get("message")
            return timesheet

        #  create data for updating timesheet
        timesheet = get_timesheet_details(self)
        data = timesheet.get("data")
        data.append(
            {
                "date": nowdate(),
                "description": "This is test timesheet for update",
                "task": self.task,
                "hours": 2,
                "is_billable": True,
                "parent": data[0].get("parent"),
                "name": "",
            }
        )

        # Update the timesheet
        method = self.method("next_pms.timesheet.api.timesheet.bulk_update_timesheet_detail")
        response = self.post(method, {"data": data})
        self.assertEqual(response.status_code, 200)

        updated_timesheet = get_timesheet_details(self)
        self.assertEqual(len(updated_timesheet.get("data")), 2)
        self.assertEqual(updated_timesheet.get("data")[1].get("hours"), 2)

    def test_d_timesheet_approval_request(self):
        """Test timesheet approval request"""

        method = self.method("next_pms.timesheet.api.timesheet.submit_for_approval")
        data = {"start_date": nowdate(), "employee": self.employee}
        response = self.post(method, data)
        # Check request is successful
        self.assertEqual(response.status_code, 200)

        #  Fetch this weeks data to validate the approval status is updated or not
        params = {"employee": self.employee, "start_date": nowdate(), "max_week": 1}
        response = self.get(
            self.method("next_pms.timesheet.api.timesheet.get_timesheet_data"),
            params=params,
        )
        self.assertEqual(response.status_code, 200)

        weekly_status = response.json.get("message").get("data").get("This Week").get("status")
        # Validate the status
        self.assertEqual(weekly_status, "Approval Pending")

    def test_e_timesheet_approval(self):
        employee = self.employee
        self.login_as_user("next-project-manager@example.com")
        self.employee = self.get_login_employee()

        method = self.method("next_pms.timesheet.api.team.approve_or_reject_timesheet")

        data = {
            "employee": employee,
            "dates": [nowdate()],
            "status": "Approved",
        }
        response = self.post(method, data)
        self.assertEqual(response.status_code, 200)
