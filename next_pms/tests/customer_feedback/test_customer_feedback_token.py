# Copyright (c) 2026, rtCamp and Contributors
# See license.txt

"""A Customer Feedback web-form submission must take schedule, customer, contact and
employee from the emailed token, never from the posted values, whoever is signed in.

Lives outside the doctype folder so IntegrationTestCase does not build linked test records
(Customer, Employee, ...) on a site holding real data; every record is inserted here and
rolled back.
"""

import json
from unittest.mock import patch

import frappe
from frappe.tests import IntegrationTestCase
from frappe.website.doctype.web_form.web_form import accept, get_link_options

from next_pms.customer_feedback.doctype.customer_feedback_schedule.customer_feedback_schedule import (
    evaluation_type_for,
    get_webform_details,
    send_feedback_request,
)
from next_pms.customer_feedback.doctype.customer_feedback_settings.customer_feedback_settings import (
    get_branding,
    get_fetch_error_message,
)
from next_pms.next_pms.patches import move_customer_feedback_module
from next_pms.tests.utils import make_test_employee
from next_pms.www.feedback.project import index as project_page
from next_pms.www.feedback.resource import index as resource_page

WEB_FORM = "customer-feedback-form"
CONTACT_EMAIL = "feedback_token@example.com"
WEBSITE_USER = "feedback_website_user@example.com"


def web_form_submit(user, **values):
    """Post to the web form exactly as a browser (or curl) would, as `user`."""
    data = {"doctype": "Customer Feedback", "additional_comments__feedback": "from test", **values}
    frappe.set_user(user)
    try:
        return accept(WEB_FORM, json.dumps(data))
    finally:
        # accept() sets this and never clears it; a later desk insert would otherwise be gated.
        frappe.flags.in_web_form = False
        frappe.set_user("Administrator")


def guest_submit(**values):
    return web_form_submit("Guest", **values)


class TestCustomerFeedbackToken(IntegrationTestCase):
    def setUp(self):
        super().setUp()
        # registered first, so a failure later in setUp still rolls everything back
        self.addCleanup(frappe.db.rollback)
        self.addCleanup(frappe.set_user, "Administrator")
        self.addCleanup(setattr, frappe.flags, "in_web_form", False)
        frappe.set_user("Administrator")
        company = frappe.db.get_value("Company", {}, "name")
        self.customer = frappe.get_doc(
            {
                "doctype": "Customer",
                "customer_name": "_Test Feedback Customer",
                "customer_type": "Company",
                "customer_group": frappe.db.get_value("Customer Group", {"is_group": 0}, "name"),
                "default_currency": frappe.db.get_default("currency") or "INR",
            }
        ).insert(ignore_permissions=True)
        # Contact.email_id is derived from the email_ids child table on validate
        self.contact = frappe.get_doc(
            {
                "doctype": "Contact",
                "first_name": "_Test Feedback",
                "email_ids": [{"email_id": CONTACT_EMAIL, "is_primary": 1}],
            }
        ).insert(ignore_permissions=True)
        self.other_contact = frappe.get_doc(
            {
                "doctype": "Contact",
                "first_name": "_Test Forged",
                "email_ids": [{"email_id": "forged_contact@example.com", "is_primary": 1}],
            }
        ).insert(ignore_permissions=True)
        self.template = frappe.get_doc(
            {
                "doctype": "Email Template",
                "name": "_Test Feedback Token Template",
                "subject": "Feedback",
                "response": "Hi {{ contact_name }}",
            }
        ).insert(ignore_permissions=True)
        if not frappe.db.exists("Designation", "_Test Token Engineer"):
            frappe.get_doc({"doctype": "Designation", "designation_name": "_Test Token Engineer"}).insert(
                ignore_permissions=True
            )
        self.emp_a = make_test_employee(last_name="TokenA", company=company, designation="_Test Token Engineer")
        self.emp_b = make_test_employee(last_name="TokenB", company=company, designation="_Test Token Engineer")
        self.schedule = self._make_schedule("Resource", [self.emp_a, self.emp_b])
        self.other_schedule = self._make_schedule("Project")
        with patch("frappe.sendmail"):
            send_feedback_request(self.schedule.name)
            send_feedback_request(self.other_schedule.name)
        self.schedule.reload()
        self.other_schedule.reload()
        self.token_a = self.schedule.resources[0].unique_token
        self.project_token = self.other_schedule.schedule_unique_token
        if not frappe.db.exists("User", WEBSITE_USER):
            frappe.get_doc(
                {
                    "doctype": "User",
                    "email": WEBSITE_USER,
                    "first_name": "Feedback Website User",
                    "user_type": "Website User",
                    "send_welcome_email": 0,
                }
            ).insert(ignore_permissions=True)

    def _make_schedule(self, feedback_type, employees=()):
        return frappe.get_doc(
            {
                "doctype": "Customer Feedback Schedule",
                "customer": self.customer.name,
                "feedback_type": feedback_type,
                "feedback_by": self.contact.name,
                "email_template": self.template.name,
                "status": "Pending",
                "feedback_from_date": "2026-01-01",
                "feedback_to_date": "2026-06-30",
                "resources": [{"employee": e} for e in employees],
            }
        ).insert(ignore_permissions=True)

    def forged_values(self):
        return {
            "customer_feedback_schedule": self.other_schedule.name,
            "customer": self.customer.name,
            "feedback_by": self.other_contact.name,
            "feedback_for": self.emp_b,
            "evaluation_type": "Project",
            "e_responsiveness": 1,
        }

    def token_a_is_live(self):
        return bool(
            frappe.db.get_value(
                "Customer Feedback Employee", {"parent": self.schedule.name, "employee": self.emp_a}, "unique_token"
            )
        )

    def test_guest_without_token_is_rejected(self):
        with self.assertRaises(frappe.PermissionError):
            guest_submit(**self.forged_values())
        self.assertFalse(frappe.db.exists("Customer Feedback", {"feedback_for": self.emp_b}))

    def test_signed_in_website_user_without_token_is_rejected(self):
        """web_form.accept inserts with ignore_permissions for everyone, so the gate must not
        depend on the caller being Guest."""
        with self.assertRaises(frappe.PermissionError):
            web_form_submit(WEBSITE_USER, **self.forged_values())
        self.assertFalse(frappe.db.exists("Customer Feedback", {"feedback_for": self.emp_b}))
        self.assertTrue(self.token_a_is_live())

    def test_guest_with_wrong_token_is_rejected_without_logout(self):
        # PermissionError, not AuthenticationError: the latter makes Frappe clear the session cookies
        with self.assertRaises(frappe.PermissionError):
            guest_submit(token="not-a-real-token", **self.forged_values())
        self.assertFalse(frappe.db.exists("Customer Feedback", {"customer": self.customer.name}))
        self.assertTrue(self.token_a_is_live())

    def test_token_pins_every_identity_field(self):
        guest_submit(token=self.token_a, **self.forged_values())

        feedback = frappe.get_doc("Customer Feedback", {"customer_feedback_schedule": self.schedule.name})
        self.assertEqual(feedback.feedback_for, self.emp_a)
        self.assertEqual(feedback.feedback_for_name, frappe.db.get_value("Employee", self.emp_a, "employee_name"))
        self.assertEqual(feedback.feedback_by, self.contact.name)
        self.assertEqual(feedback.contact_email, CONTACT_EMAIL)
        self.assertEqual(feedback.customer_feedback_schedule, self.schedule.name)
        # derived from the employee's designation, not the posted "Project"
        self.assertEqual(feedback.evaluation_type, "Engineer")
        self.assertTrue(feedback.name.startswith(f"CUSTF-{self.emp_a}-"))
        self.assertEqual(feedback.docstatus, 1)
        self.assertFalse(feedback.get("token"))  # virtual field: never stored
        self.assertFalse(frappe.db.exists("Customer Feedback", {"feedback_for": self.emp_b}))

        # the token is spent, the other employee's is not
        self.schedule.reload()
        self.assertIsNone(self.schedule.resources[0].unique_token)
        self.assertIsNotNone(self.schedule.resources[1].unique_token)
        with self.assertRaises(frappe.PermissionError):
            guest_submit(token=self.token_a, **self.forged_values())

    def test_project_token_pins_project_fields(self):
        values = dict(self.forged_values(), customer_feedback_schedule=self.schedule.name, evaluation_type="Engineer")
        guest_submit(token=self.project_token, **values)

        feedback = frappe.get_doc("Customer Feedback", {"customer_feedback_schedule": self.other_schedule.name})
        self.assertEqual(feedback.evaluation_type, "Project")
        self.assertFalse(feedback.feedback_for)
        self.assertFalse(feedback.feedback_for_name)
        self.assertEqual(feedback.feedback_by, self.contact.name)
        self.assertEqual(feedback.contact_email, CONTACT_EMAIL)
        self.assertTrue(feedback.name.startswith(f"CUSTF-{frappe.utils.nowdate()[:4]}-"))
        self.assertEqual(feedback.docstatus, 1)
        self.assertFalse(frappe.db.exists("Customer Feedback", {"customer_feedback_schedule": self.schedule.name}))

        self.assertIsNone(
            frappe.db.get_value("Customer Feedback Schedule", self.other_schedule.name, "schedule_unique_token")
        )
        with self.assertRaises(frappe.PermissionError):
            guest_submit(token=self.project_token, **values)

    def test_resource_listing_token_is_not_a_submission_token(self):
        """A Resource schedule's schedule_unique_token only opens the /feedback/resource listing;
        each employee's unique_token is what submits."""
        with self.assertRaises(frappe.PermissionError):
            guest_submit(token=self.schedule.schedule_unique_token, **self.forged_values())
        self.assertFalse(frappe.db.exists("Customer Feedback", {"customer": self.customer.name}))

    def test_empty_evaluation_type_is_still_derived(self):
        values = dict(self.forged_values(), evaluation_type="")
        guest_submit(token=self.token_a, **values)
        feedback = frappe.get_doc("Customer Feedback", {"customer_feedback_schedule": self.schedule.name})
        self.assertEqual(feedback.evaluation_type, "Engineer")

    def test_evaluation_type_for(self):
        self.assertEqual(evaluation_type_for("Senior Project Manager"), "Project Manager")
        self.assertEqual(evaluation_type_for("Project Coordinator"), "Project Coordinator")
        self.assertEqual(evaluation_type_for("Quality Analyst"), "Quality Engineer")
        self.assertEqual(evaluation_type_for("Software Engineer"), "Engineer")
        self.assertEqual(evaluation_type_for(None), "Project Manager")

    def test_token_is_spent_before_insert_so_a_second_use_fails(self):
        """The token is spent inside before_insert, not in after_insert: a second doc carrying the
        same token is refused before the first is even inserted. This runs on one connection, so
        it proves the ordering, not the row lock; the lock is what makes it hold across requests."""
        frappe.set_user("Guest")
        frappe.flags.in_web_form = True
        first = frappe.get_doc({"doctype": "Customer Feedback", "token": self.token_a})
        second = frappe.get_doc({"doctype": "Customer Feedback", "token": self.token_a})
        first.run_method("before_insert")
        with self.assertRaises(frappe.PermissionError):
            second.run_method("before_insert")
        self.assertFalse(self.token_a_is_live())

    def test_amended_from_is_not_postable(self):
        self.assertFalse(
            frappe.db.exists("Web Form Field", {"parent": WEB_FORM, "fieldname": "amended_from"}),
            "amended_from must not be a web form field",
        )
        other_resource_schedule = self._make_schedule("Resource", [self.emp_a])
        victim = frappe.get_doc(
            {
                "doctype": "Customer Feedback",
                "customer_feedback_schedule": other_resource_schedule.name,
                "customer": self.customer.name,
                "feedback_by": self.contact.name,
                "feedback_for": self.emp_a,
                "evaluation_type": "Engineer",
                "additional_comments__feedback": "old",
            }
        ).insert()
        victim.reload()
        victim.cancel()

        guest_submit(token=self.token_a, amended_from=victim.name)
        feedback = frappe.get_doc("Customer Feedback", {"customer_feedback_schedule": self.schedule.name})
        self.assertFalse(feedback.amended_from)

    def test_send_feedback_request_needs_write_on_schedule(self):
        """Anyone with write on the schedule can (re)send; a user without it cannot mint tokens."""
        frappe.set_user(WEBSITE_USER)
        with self.assertRaises(frappe.PermissionError), patch("frappe.sendmail") as sendmail:
            send_feedback_request(self.schedule.name)
        sendmail.assert_not_called()
        self.assertEqual(
            frappe.db.get_value(
                "Customer Feedback Employee", {"parent": self.schedule.name, "employee": self.emp_a}, "unique_token"
            ),
            self.token_a,
        )

    def test_desk_user_needs_no_token(self):
        feedback = frappe.get_doc(
            {
                "doctype": "Customer Feedback",
                "customer_feedback_schedule": self.schedule.name,
                "customer": self.customer.name,
                "feedback_by": self.contact.name,
                "feedback_for": self.emp_b,
                "evaluation_type": "Engineer",
                "additional_comments__feedback": "from desk",
            }
        ).insert()
        self.assertEqual(feedback.feedback_for, self.emp_b)

    def test_list_token_is_rejected_everywhere(self):
        """?token=a&token=b reaches form_dict as a list, which get_all would read as an operator
        and match every schedule. get_webform_details needs no guard: its `token: str` hint
        makes the whitelist wrapper reject a list."""
        with self.assertRaises(frappe.exceptions.FrappeTypeError):
            get_webform_details(["like", "%"])
        self.addCleanup(setattr, frappe.local, "form_dict", frappe.local.form_dict)
        for page in (resource_page, project_page):
            frappe.local.form_dict = frappe._dict(token=["like", "%"])
            context = page.get_context(frappe._dict())
            self.assertTrue(context.error)
            self.assertFalse(context.get("employees") or context.get("projects"))

    def test_web_form_has_no_link_fields(self):
        """get_link_options lets Guest list every record of any Link field's doctype on an open form."""
        self.assertFalse(frappe.get_all("Web Form Field", {"parent": WEB_FORM, "fieldtype": "Link"}, pluck="fieldname"))
        frappe.set_user("Guest")
        with self.assertRaises(frappe.PermissionError):
            get_link_options(WEB_FORM, "Employee")

    def test_resend_skips_employees_who_already_answered(self):
        guest_submit(token=self.token_a, **self.forged_values())
        with patch("frappe.sendmail"):
            send_feedback_request(self.schedule.name)
        self.schedule.reload()
        self.assertIsNone(self.schedule.resources[0].unique_token)
        self.assertIsNotNone(self.schedule.resources[1].unique_token)

    def test_resend_refuses_a_fully_answered_schedule(self):
        guest_submit(token=self.project_token, **self.forged_values())
        with self.assertRaises(frappe.ValidationError), patch("frappe.sendmail") as sendmail:
            send_feedback_request(self.other_schedule.name)
        sendmail.assert_not_called()
        self.assertIsNone(
            frappe.db.get_value("Customer Feedback Schedule", self.other_schedule.name, "schedule_unique_token")
        )

    def test_submission_bumps_schedule_modified_so_a_stale_form_cannot_restore_the_token(self):
        self.schedule.submit()  # as in production: schedules are submitted before they are sent
        stale = frappe.get_doc("Customer Feedback Schedule", self.schedule.name)
        guest_submit(token=self.token_a, **self.forged_values())
        self.assertFalse(self.token_a_is_live())
        with self.assertRaises(frappe.TimestampMismatchError):
            stale.save()
        self.assertFalse(self.token_a_is_live())

    def test_submission_notifies_the_project_manager(self):
        project = frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": "_Test Feedback Notify Project",
                "company": frappe.db.get_value("Company", {}, "name"),
                "customer": self.customer.name,
                "custom_project_manager": "Administrator",
            }
        ).insert(ignore_permissions=True)
        self.other_schedule.append("projects", {"project": project.name})
        self.other_schedule.save(ignore_permissions=True)

        guest_submit(token=self.project_token, **self.forged_values())

        feedback = frappe.get_value("Customer Feedback", {"customer_feedback_schedule": self.other_schedule.name})
        notified = {
            "user": "Administrator",
            "linked_document": feedback,
            "url": f"/next-pms/projects/{project.name}?tab=feedback",
        }
        # exactly one: after_insert submits, and insert() then reruns the post-save methods
        self.assertEqual(frappe.db.count("NextPMS Notifications", notified), 1)

    def test_branding_falls_back_and_escapes_the_support_email(self):
        frappe.db.set_single_value(
            "Customer Feedback Settings", {"brand_title": None, "brand_logo": None, "support_email": None}
        )
        frappe.clear_document_cache("Customer Feedback Settings", "Customer Feedback Settings")
        self.assertTrue(get_branding()["brand_logo"])
        self.assertNotIn("mailto", get_fetch_error_message(None))
        message = get_fetch_error_message("<b>x</b>@example.com")
        self.assertIn("mailto:", message)
        self.assertNotIn("<b>", message)

    def test_module_def_is_handed_to_next_pms(self):
        frappe.db.set_value("Module Def", "Customer Feedback", "app_name", "rtcamp")
        move_customer_feedback_module.execute()
        self.assertEqual(frappe.db.get_value("Module Def", "Customer Feedback", "app_name"), "next_pms")
