from unittest.mock import patch

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase
from frappe.utils import nowdate

from next_pms.tests.utils import make_employee
from next_pms.timesheet.api.timesheet import delete, save, submit_for_approval, update_timesheet_detail
from next_pms.timesheet.api.utils import get_project_editable_employees

MANAGER_USER = "edit-others-projects-manager@example.com"
LEADERSHIP_USER = "edit-others-leadership@example.com"
REVIEWER_USER = "edit-others-projects-user@example.com"
PLAIN_EMPLOYEE_USER = "edit-others-plain-employee@example.com"
REPORT_USER = "edit-others-report@example.com"
MEMBER_USER = "edit-others-member@example.com"
MANAGED_PROJECT_NAME = "Edit Others Managed Project"
OTHER_PROJECT_NAME = "Edit Others Other Project"


class TestEditOthersTime(IntegrationTestCase):
    """Projects Manager, PMS Leadership and System Manager add and edit anyone's time; a Projects
    User edits their reports' time on any project and anyone's time on a project they manage."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        company = get_default_company()
        reviewer = make_employee(REVIEWER_USER, company=company, leave_approver="Administrator")
        make_employee(MANAGER_USER, company=company, leave_approver="Administrator")
        make_employee(LEADERSHIP_USER, company=company, leave_approver="Administrator")
        make_employee(PLAIN_EMPLOYEE_USER, company=company, leave_approver="Administrator")
        cls.report = make_employee(REPORT_USER, company=company, leave_approver="Administrator")
        cls.member = make_employee(MEMBER_USER, company=company, leave_approver="Administrator")
        frappe.db.set_value("Employee", cls.report, "reports_to", reviewer)
        frappe.db.set_value("Employee", cls.member, "reports_to", None)

        frappe.get_doc("User", REVIEWER_USER).add_roles("Projects User")
        frappe.get_doc("User", MANAGER_USER).add_roles("Projects User", "Projects Manager")
        frappe.get_doc("User", LEADERSHIP_USER).add_roles("Projects User", "Projects Manager", "PMS Leadership")

        cls.managed_project = cls._project(MANAGED_PROJECT_NAME, company)
        cls.other_project = cls._project(OTHER_PROJECT_NAME, company)
        frappe.db.set_value(
            "Project",
            cls.managed_project,
            {"custom_engineering_manager": REVIEWER_USER, "custom_project_manager": None},
        )
        frappe.db.set_value(
            "Project", cls.other_project, {"custom_engineering_manager": None, "custom_project_manager": None}
        )
        cls.managed_task = cls._task("Edit Others Managed Task", cls.managed_project)
        cls.other_task = cls._task("Edit Others Other Task", cls.other_project)

    @staticmethod
    def _project(name, company):
        return frappe.db.get_value("Project", {"project_name": name}) or (
            frappe.get_doc(
                {"doctype": "Project", "project_name": name, "company": company, "custom_billing_type": "Non-Billable"}
            )
            .insert(ignore_permissions=True)
            .name
        )

    @staticmethod
    def _task(subject, project):
        return frappe.db.get_value("Task", {"subject": subject}) or (
            frappe.get_doc({"doctype": "Task", "subject": subject, "project": project})
            .insert(ignore_permissions=True)
            .name
        )

    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.delete("Timesheet", {"employee": ["in", [self.report, self.member]]})

    def tearDown(self):
        frappe.set_user("Administrator")

    def _log_as(self, user, employee, task):
        frappe.set_user(user)
        try:
            save(date=nowdate(), description="Logged by someone else", task=task, hours=1, employee=employee)
        finally:
            frappe.set_user("Administrator")

    def _entry(self, employee, project):
        parent = frappe.db.get_value("Timesheet", {"employee": employee, "parent_project": project})
        return parent, frappe.db.get_value("Timesheet Detail", {"parent": parent}, "name")

    def test_managers_and_leadership_log_anyones_time_on_any_project(self):
        for user in (MANAGER_USER, LEADERSHIP_USER):
            self._log_as(user, self.member, self.other_task)
            self.assertTrue(self._entry(self.member, self.other_project)[1], user)
            frappe.db.delete("Timesheet", {"employee": self.member})

    def test_projects_user_logs_a_reports_time_on_any_project(self):
        self._log_as(REVIEWER_USER, self.report, self.other_task)
        self.assertTrue(self._entry(self.report, self.other_project)[1])

    def test_projects_user_logs_a_members_time_on_a_managed_project(self):
        self._log_as(REVIEWER_USER, self.member, self.managed_task)
        self.assertTrue(self._entry(self.member, self.managed_project)[1])

    def test_projects_user_cannot_log_a_non_reports_time_on_another_project(self):
        with self.assertRaises(frappe.PermissionError):
            self._log_as(REVIEWER_USER, self.member, self.other_task)

    def test_plain_employee_cannot_log_someone_elses_time(self):
        with self.assertRaises(frappe.PermissionError):
            self._log_as(PLAIN_EMPLOYEE_USER, self.member, self.managed_task)

    def test_projects_user_edits_a_members_entry_on_a_managed_project(self):
        save(date=nowdate(), description="Own entry", task=self.managed_task, hours=1, employee=self.member)
        parent, name = self._entry(self.member, self.managed_project)

        frappe.set_user(REVIEWER_USER)
        update_timesheet_detail(
            name=name, parent=parent, hours=2, description="Corrected", task=self.managed_task, date=nowdate()
        )
        frappe.set_user("Administrator")
        self.assertEqual(frappe.db.get_value("Timesheet Detail", name, "hours"), 2)

    def test_projects_user_cannot_move_a_members_entry_to_an_unmanaged_project(self):
        save(date=nowdate(), description="Own entry", task=self.managed_task, hours=1, employee=self.member)
        parent, name = self._entry(self.member, self.managed_project)

        frappe.set_user(REVIEWER_USER)
        with self.assertRaises(frappe.PermissionError):
            update_timesheet_detail(
                name=name, parent=parent, hours=1, description="Moved", task=self.other_task, date=nowdate()
            )

    def test_projects_user_cannot_edit_or_delete_a_members_entry_on_another_project(self):
        save(date=nowdate(), description="Own entry", task=self.other_task, hours=1, employee=self.member)
        parent, name = self._entry(self.member, self.other_project)

        frappe.set_user(REVIEWER_USER)
        with self.assertRaises(frappe.PermissionError):
            update_timesheet_detail(
                name=name, parent=parent, hours=2, description="Edited", task=self.other_task, date=nowdate()
            )
        with self.assertRaises(frappe.PermissionError):
            delete(parent=parent, name=name)

    def test_projects_user_deletes_a_reports_entry_on_any_project(self):
        save(date=nowdate(), description="Own entry", task=self.other_task, hours=1, employee=self.report)
        parent, name = self._entry(self.report, self.other_project)

        frappe.set_user(REVIEWER_USER)
        delete(parent=parent, name=name)
        frappe.set_user("Administrator")
        self.assertFalse(frappe.db.exists("Timesheet Detail", name))

    def test_projects_user_cannot_submit_a_non_reports_week(self):
        save(date=nowdate(), description="Own entry", task=self.managed_task, hours=1, employee=self.member)

        frappe.set_user(REVIEWER_USER)
        with self.assertRaises(frappe.PermissionError):
            submit_for_approval(start_date=nowdate(), employee=self.member)

    def test_project_rows_offer_editing_only_where_the_api_allows_it(self):
        members = {self.managed_project: {self.report, self.member}, self.other_project: {self.report, self.member}}

        frappe.set_user(REVIEWER_USER)
        self.assertEqual(
            get_project_editable_employees(members),
            {self.managed_project: sorted([self.report, self.member]), self.other_project: [self.report]},
        )
        frappe.set_user(MANAGER_USER)
        self.assertEqual(
            get_project_editable_employees(members),
            {project: sorted([self.report, self.member]) for project in members},
        )

    def test_projects_user_deletes_a_members_last_entry_on_a_managed_project(self):
        save(date=nowdate(), description="Only entry", task=self.managed_task, hours=1, employee=self.member)
        parent, name = self._entry(self.member, self.managed_project)

        frappe.set_user(REVIEWER_USER)
        delete(parent=parent, name=name)
        frappe.set_user("Administrator")
        self.assertFalse(frappe.db.exists("Timesheet", parent))

    def test_editors_realtime_week_leaves_out_projects_they_cannot_read(self):
        save(date=nowdate(), description="Elsewhere", task=self.other_task, hours=1, employee=self.member)

        frappe.set_user(REVIEWER_USER)
        with patch("frappe.publish_realtime") as publish:
            save(date=nowdate(), description="By the EM", task=self.managed_task, hours=1, employee=self.member)
        frappe.set_user("Administrator")

        project_weeks = [
            call.args[1]["message"]
            for call in publish.call_args_list
            if call.args[0] == "project_timesheet_info" and "message" in call.args[1]
        ]
        self.assertTrue(project_weeks)
        self.assertEqual(set(project_weeks[-1]["projects"]), {self.managed_project})
