import sys
import types
from contextlib import contextmanager
from unittest.mock import patch

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.next_projects.api.email import get_project_emails

ALLOWED_USER = "priya.sharma@example.com"
DENIED_USER = "rohan.verma@example.com"

GMAIL_APP = "frappe_gmail_thread"
GMAIL_NOT_INSTALLED = ["frappe", "erpnext", "next_pms"]


class TestGetProjectEmails(IntegrationTestCase):
    """get_project_emails returns the Communication emails linked to a project, merged
    with any linked Gmail threads, behind the ALLOWED_ROLES gate.

    IntegrationTestCase only rolls back once per class (no per-test rollback), so all
    fixtures are built once in setUpClass and every test reads the same fixed dataset.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.customer = cls._get_customer()

        cls.allowed_user = cls._make_user(ALLOWED_USER, roles=["Projects User"])
        cls.denied_user = cls._make_user(DENIED_USER, roles=[])

        cls.project = cls._make_project("Website Redesign")
        cls.other_project = cls._make_project("Mobile App")
        cls.empty_project = cls._make_project("Internal Tooling")

        # Email communications on the project under test.
        cls.comm_plain = cls._make_communication(cls.project, "Kickoff agenda", ALLOWED_USER)
        cls.comm_with_files = cls._make_communication(cls.project, "Design specs", ALLOWED_USER)
        cls.comm_sibling = cls._make_communication(cls.project, "Status update", ALLOWED_USER)
        cls._make_attachment(cls.comm_with_files, "/files/spec.pdf", is_private=0)
        cls._make_attachment(cls.comm_with_files, "/private/files/budget.xlsx", is_private=1)

        # Noise that must never surface for cls.project.
        cls._make_communication(cls.project, "Phone note", ALLOWED_USER, medium="Phone")
        cls._make_communication(cls.other_project, "Other project mail", ALLOWED_USER)

        cls.project_email_ids = {cls.comm_plain, cls.comm_with_files, cls.comm_sibling}

        frappe.clear_cache()

    @classmethod
    def _get_customer(cls):
        if frappe.db.exists("Customer", "Google"):
            return "Google"
        return (
            frappe.get_doc(
                {
                    "doctype": "Customer",
                    "customer_name": "Google",
                    "customer_type": "Company",
                    "default_currency": frappe.get_cached_value("Company", cls.company, "default_currency"),
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _make_user(cls, email, roles):
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
        if roles:
            frappe.get_doc("User", email).add_roles(*roles)
        return email

    @classmethod
    def _make_project(cls, project_name):
        return (
            frappe.get_doc(
                {
                    "doctype": "Project",
                    "project_name": project_name,
                    "company": cls.company,
                    "customer": cls.customer,
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    @classmethod
    def _make_communication(
        cls,
        project,
        subject,
        sender,
        *,
        medium="Email",
        reference_doctype="Project",
        **kwargs,
    ):
        doc = frappe.get_doc(
            {
                "doctype": "Communication",
                "communication_type": "Communication",
                "communication_medium": medium,
                "status": "Linked",
                "sent_or_received": "Received",
                "reference_doctype": reference_doctype,
                "reference_name": project,
                "subject": subject,
                "content": f"<p>{subject}</p>",
                "sender": sender,
                "sender_full_name": sender.split("@")[0],
                "recipients": "team@example.com",
                "cc": "",
                "bcc": "",
            }
        )
        doc.update(kwargs)
        return doc.insert(ignore_permissions=True).name

    @classmethod
    def _make_attachment(cls, communication_name, file_url, is_private):
        # File.before_insert reads the real bytes off disk; the endpoint only reads the
        # row back via frappe.get_all, so write the row directly and skip the filesystem.
        file = frappe.get_doc(
            {
                "doctype": "File",
                "file_name": file_url.rsplit("/", 1)[-1],
                "file_url": file_url,
                "is_private": is_private,
                "attached_to_doctype": "Communication",
                "attached_to_name": communication_name,
            }
        )
        file.name = frappe.generate_hash(length=10)
        file.db_insert()
        return file.name

    @staticmethod
    def _gmail_entry(thread_name, creation, subject, *, sender="external@partner.com", attachments=None):
        return {
            "name": thread_name,
            "template_data": {
                "doc": {
                    "name": thread_name,
                    "creation": creation,
                    "subject": subject,
                    "content": f"<p>{subject}</p>",
                    "sender": sender,
                    "sender_full_name": sender.split("@")[0],
                    "recipients": "team@example.com",
                    "cc": "",
                    "bcc": "",
                    "read_by_recipient": 0,
                    "delivery_status": "Received",
                    "attachments": attachments or [],
                }
            },
        }

    @contextmanager
    def _mock_gmail_threads(self, threads):
        # CI has no frappe_gmail_thread app, and the endpoint imports it locally only
        # after the installed-apps guard. Register a fake module so the local import
        # resolves to our stub regardless of whether the app is installed.
        activity = types.ModuleType(f"{GMAIL_APP}.api.activity")
        activity.get_linked_gmail_threads = lambda doctype, docname: threads
        fake_modules = {
            GMAIL_APP: types.ModuleType(GMAIL_APP),
            f"{GMAIL_APP}.api": types.ModuleType(f"{GMAIL_APP}.api"),
            f"{GMAIL_APP}.api.activity": activity,
        }
        with (
            patch.dict(sys.modules, fake_modules),
            patch(
                "next_pms.next_projects.api.email.frappe.get_installed_apps",
                return_value=[*GMAIL_NOT_INSTALLED, GMAIL_APP],
            ),
        ):
            yield

    def tearDown(self):
        frappe.set_user("Administrator")

    def _call_as(self, user, project):
        frappe.set_user(user)
        return get_project_emails(project=project)

    # --- Permission / validation -------------------------------------------------

    def test_denied_role_raises_permission_error(self):
        with self.assertRaises(frappe.PermissionError):
            self._call_as(self.denied_user, self.project)

    def test_missing_project_raises(self):
        with self.assertRaises(frappe.ValidationError):
            self._call_as(self.allowed_user, "")

    def test_unknown_project_raises_does_not_exist(self):
        with self.assertRaises(frappe.DoesNotExistError):
            self._call_as(self.allowed_user, "PROJ-does-not-exist")

    # --- Communications path -----------------------------------------------------

    def test_returns_only_project_email_communications(self):
        result = self._call_as(self.allowed_user, self.project)

        # Only the project's Email communications — Phone medium and other-project mail excluded.
        self.assertEqual({e["name"] for e in result}, self.project_email_ids)

        plain = next(e for e in result if e["name"] == self.comm_plain)
        self.assertEqual(plain["subject"], "Kickoff agenda")
        self.assertEqual(plain["sender"], ALLOWED_USER)
        self.assertEqual(plain["sender_full_name"], "priya.sharma")
        self.assertEqual(plain["recipients"], "team@example.com")
        self.assertIn("content", plain)
        self.assertEqual(plain["attachments"], [])

    def test_attachments_grouped_per_communication(self):
        result = self._call_as(self.allowed_user, self.project)
        by_name = {e["name"]: e for e in result}

        attachments = by_name[self.comm_with_files]["attachments"]
        self.assertEqual(
            {(a["file_url"], a["is_private"]) for a in attachments},
            {("/files/spec.pdf", 0), ("/private/files/budget.xlsx", 1)},
        )
        # A sibling communication must not inherit the other's attachments.
        self.assertEqual(by_name[self.comm_sibling]["attachments"], [])

    def test_empty_project_returns_empty_list(self):
        with patch(
            "next_pms.next_projects.api.email.frappe.get_installed_apps",
            return_value=GMAIL_NOT_INSTALLED,
        ):
            result = self._call_as(self.allowed_user, self.empty_project)

        self.assertEqual(result, [])

    # --- Gmail path --------------------------------------------------------------

    def test_gmail_not_installed_skips_threads(self):
        with patch(
            "next_pms.next_projects.api.email.frappe.get_installed_apps",
            return_value=GMAIL_NOT_INSTALLED,
        ):
            result = self._call_as(self.allowed_user, self.project)

        self.assertEqual({e["name"] for e in result}, self.project_email_ids)

    def test_gmail_threads_appended_with_unique_ids(self):
        threads = [
            self._gmail_entry("GMAIL-THREAD-001", "2026-06-20 09:00:00", "Re: Proposal"),
            self._gmail_entry("GMAIL-THREAD-001", "2026-06-21 14:30:00", "Re: Proposal (follow-up)"),
        ]

        with self._mock_gmail_threads(threads):
            result = self._call_as(self.allowed_user, self.project)

        # Communications first, then the gmail emails appended at the end.
        self.assertEqual({e["name"] for e in result[:-2]}, self.project_email_ids)
        gmail_ids = [e["name"] for e in result[-2:]]
        self.assertEqual(
            gmail_ids,
            ["GMAIL-THREAD-001-2026-06-20 09:00:00", "GMAIL-THREAD-001-2026-06-21 14:30:00"],
        )
        # Synthesized ids keep frontend keys unique despite the shared thread name.
        self.assertEqual(len(set(gmail_ids)), 2)

    def test_gmail_attachments_passed_through(self):
        attachments = [{"file_url": "/files/contract.pdf", "is_private": 0}]
        threads = [
            self._gmail_entry("GMAIL-THREAD-002", "2026-06-22 10:00:00", "Signed contract", attachments=attachments)
        ]

        with self._mock_gmail_threads(threads):
            result = self._call_as(self.allowed_user, self.empty_project)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["attachments"], attachments)
