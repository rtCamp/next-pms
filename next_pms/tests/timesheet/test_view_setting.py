import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.tests.utils import make_employee
from next_pms.timesheet.doctype.pms_view_setting.pms_view_setting import create_view

EMPLOYEE_USER = "views.employee@example.com"
MANAGER_USER = "views.manager@example.com"


def _view(label, public=0):
    return {"label": label, "dt": "Project", "route": "/projects", "type": "List", "public": public}


class TestPMSViewSetting(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        company = get_default_company()
        make_employee(EMPLOYEE_USER, company=company)
        make_employee(MANAGER_USER, company=company)
        frappe.get_doc("User", MANAGER_USER).add_roles("Projects Manager")

    def tearDown(self):
        frappe.set_user("Administrator")

    def test_public_views_need_the_public_views_capability(self):
        frappe.set_user(EMPLOYEE_USER)
        with self.assertRaises(frappe.PermissionError):
            create_view(_view("Employee public", public=1))
        frappe.set_user(MANAGER_USER)
        create_view(_view("Manager public", public=1))
        self.assertTrue(frappe.db.exists("PMS View Setting", {"label": "Manager public", "public": 1}))

    def test_owner_deletes_own_personal_view(self):
        frappe.set_user(EMPLOYEE_USER)
        create_view(_view("Employee personal"))
        name = frappe.db.get_value("PMS View Setting", {"label": "Employee personal", "user": EMPLOYEE_USER})
        frappe.delete_doc("PMS View Setting", name)
        self.assertFalse(frappe.db.exists("PMS View Setting", name))
