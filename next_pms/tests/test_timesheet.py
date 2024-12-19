import frappe
from frappe.utils import nowdate

from next_pms.tests import TestNextPms


class TestTimesheet(TestNextPms):
    def test_timesheet_data(self):
        self.login_as_user("next-employee@example.com")
        self.assertEqual(frappe.session.user, "next-employee@example.com")

        employee = self.get_login_employee()
        params = {
            "employee": employee,
            "start_date": nowdate(),
            "max_week": 4,
        }

        response = self.get(
            self.method("next_pms.timesheet.api.timesheet.get_timesheet_data"),
            params=params,
        )
        self.assertEqual(response.status_code, 200)
