import unittest

import frappe
from frappe.tests import IntegrationTestCase

from next_pms.next_projects.api.feedback import (
    add_comment_to_feedback,
    delete_comment_from_feedback,
    get_feedback_comments,
    update_comment_in_feedback,
)

AUTHOR_USER = "feedback.author@example.com"
OTHER_USER = "feedback.other@example.com"
# Holds no Projects role, so the endpoints' only_for gate must reject it.
NO_ROLE_USER = "feedback.norole@example.com"


def find_comment(comments: list[dict], name: str) -> dict | None:
    """Depth-first search for a comment by name in the nested reply tree."""
    for comment in comments:
        if comment["name"] == name:
            return comment
        found = find_comment(comment.get("replies", []), name)
        if found:
            return found
    return None


class TestFeedbackComments(IntegrationTestCase):
    """Cover the Customer Feedback threaded comment endpoints.

    Comments are Comment documents referencing the feedback record; replies
    link to their parent through custom_reply_to. Deleting is a soft delete:
    the content is blanked (the tombstone marker) while the author and thread
    structure are preserved, so replies stay anchored. A deleted comment can
    no longer be edited or deleted again.

    The commenting roles hold no doctype permission on Comment or Customer
    Feedback, so the endpoints (which run with elevated permissions) are the
    only access path.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        if not frappe.db.exists("DocType", "Customer Feedback"):
            raise unittest.SkipTest("Customer Feedback doctypes not installed on this site")
        cls.feedback = cls.make_feedback()

        # Projects Manager clears the ALLOWED_ROLES gate on the endpoints; the
        # doctypes themselves grant this role no CRUD, so the API is the sole gate.
        cls.author_user = cls.make_user(AUTHOR_USER, roles=("Projects Manager",))
        cls.other_user = cls.make_user(OTHER_USER, roles=("Projects Manager",))
        cls.no_role_user = cls.make_user(NO_ROLE_USER)

    @classmethod
    def make_user(cls, email, roles=()):
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
    def make_feedback(cls):
        customer = frappe.db.get_value("Customer", {}, "name")
        if not customer:
            customer = (
                frappe.get_doc(
                    {
                        "doctype": "Customer",
                        "customer_name": "Acme Corporation",
                        "customer_type": "Company",
                    }
                )
                .insert(ignore_permissions=True)
                .name
            )
        schedule = frappe.get_doc(
            {
                "doctype": "Customer Feedback Schedule",
                "customer": customer,
                "feedback_type": "Resource",
                "feedback_from_date": "2026-06-01",
                "feedback_to_date": "2026-06-30",
            }
        ).insert(ignore_permissions=True, ignore_mandatory=True)
        feedback = frappe.get_doc(
            {
                "doctype": "Customer Feedback",
                "customer": customer,
                "evaluation_type": "Engineer",
                "customer_feedback_schedule": schedule.name,
                "additional_comments__feedback": "test",
            }
        ).insert(ignore_permissions=True, ignore_mandatory=True)
        return feedback.name

    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.delete(
            "Comment",
            {"reference_doctype": "Customer Feedback", "reference_name": self.feedback},
        )

    def tearDown(self):
        frappe.set_user("Administrator")

    def add_comment(self, comment, reply_to=None, user=None):
        frappe.set_user(user or self.author_user)
        tree = add_comment_to_feedback(feedback=self.feedback, comment=comment, reply_to=reply_to)
        added = frappe.get_all(
            "Comment",
            filters={"reference_doctype": "Customer Feedback", "reference_name": self.feedback},
            order_by="creation desc",
            limit=1,
            pluck="name",
        )[0]
        return added, tree

    def test_get_missing_feedback_raises(self):
        frappe.set_user(self.author_user)
        with self.assertRaises(frappe.DoesNotExistError):
            get_feedback_comments(feedback="CUSTF-DOES-NOT-EXIST")

    def test_no_role_user_is_rejected(self):
        frappe.set_user(self.no_role_user)
        with self.assertRaises(frappe.PermissionError):
            get_feedback_comments(feedback=self.feedback)
        with self.assertRaises(frappe.PermissionError):
            add_comment_to_feedback(feedback=self.feedback, comment="<p>nope</p>")

    def test_allowed_role_has_no_direct_doctype_access(self):
        frappe.set_user(self.author_user)
        with self.assertRaises(frappe.PermissionError):
            frappe.get_list("Comment", filters={"reference_name": self.feedback})

    def test_add_root_comment(self):
        name, tree = self.add_comment("<p>root comment</p>")
        root = find_comment(tree, name)
        self.assertIsNotNone(root)
        self.assertEqual(root["comment"], "<p>root comment</p>")
        self.assertEqual(root["user"], self.author_user)
        self.assertFalse(root["edited"])
        self.assertFalse(root["deleted"])
        self.assertEqual(root["replies"], [])

    def test_add_comment_with_mention(self):
        mention = (
            f'<span class="mention" data-type="mention" data-id="{OTHER_USER}" '
            'data-label="Other">@Other</span>'
        )
        name, tree = self.add_comment(f"<p>{mention} ping</p>")
        comment = find_comment(tree, name)

        self.assertIsNotNone(comment)
        self.assertNotIn('data-type="mention"', comment["comment"])
        self.assertIn(f'data-id="{OTHER_USER}"', comment["comment"])

    def test_add_blank_comment_raises(self):
        frappe.set_user(self.author_user)
        with self.assertRaises(frappe.ValidationError):
            add_comment_to_feedback(feedback=self.feedback, comment="<p>  </p>")

    def test_add_reply_nests_under_parent(self):
        parent, _ = self.add_comment("<p>parent</p>")
        reply, tree = self.add_comment("<p>reply</p>", reply_to=parent, user=self.other_user)
        root = find_comment(tree, parent)
        self.assertEqual(root["reply_count"], 1)
        self.assertEqual(root["replies"][0]["name"], reply)
        self.assertEqual(root["replies"][0]["user"], self.other_user)
        self.assertEqual(root["replies"][0]["reply_to"], parent)

    def test_reply_to_unknown_parent_raises(self):
        frappe.set_user(self.author_user)
        with self.assertRaises(frappe.ValidationError):
            add_comment_to_feedback(feedback=self.feedback, comment="<p>orphan</p>", reply_to="not-a-comment")

    def test_edit_own_comment(self):
        name, _ = self.add_comment("<p>original</p>")
        tree = update_comment_in_feedback(comment_name=name, comment="<p>changed</p>")
        edited = find_comment(tree, name)
        self.assertEqual(edited["comment"], "<p>changed</p>")
        self.assertTrue(edited["edited"])
        self.assertFalse(edited["deleted"])

    def test_edit_to_blank_raises(self):
        name, _ = self.add_comment("<p>original</p>")
        with self.assertRaises(frappe.ValidationError):
            update_comment_in_feedback(comment_name=name, comment="<p></p>")

    def test_edit_others_comment_is_rejected(self):
        name, _ = self.add_comment("<p>author's</p>")
        frappe.set_user(self.other_user)
        with self.assertRaises(frappe.PermissionError):
            update_comment_in_feedback(comment_name=name, comment="<p>hijack</p>")

    def test_administrator_can_edit_any_comment(self):
        name, _ = self.add_comment("<p>author's</p>")
        frappe.set_user("Administrator")
        tree = update_comment_in_feedback(comment_name=name, comment="<p>moderated</p>")
        self.assertEqual(find_comment(tree, name)["comment"], "<p>moderated</p>")

    def test_delete_is_soft_and_keeps_replies(self):
        parent, _ = self.add_comment("<p>parent</p>")
        reply, _ = self.add_comment("<p>reply</p>", reply_to=parent, user=self.other_user)
        frappe.set_user(self.author_user)
        tree = delete_comment_from_feedback(comment_name=parent)
        tombstone = find_comment(tree, parent)
        self.assertTrue(tombstone["deleted"])
        self.assertEqual(tombstone["comment"], "")
        self.assertIsNotNone(tombstone["deleted_at"])
        self.assertEqual(tombstone["user"], self.author_user)
        self.assertEqual(tombstone["reply_count"], 1)
        self.assertEqual(tombstone["replies"][0]["name"], reply)
        self.assertFalse(tombstone["replies"][0]["deleted"])

    def test_delete_twice_raises(self):
        name, _ = self.add_comment("<p>gone</p>")
        delete_comment_from_feedback(comment_name=name)
        with self.assertRaises(frappe.ValidationError):
            delete_comment_from_feedback(comment_name=name)

    def test_deleted_comment_cannot_be_edited(self):
        name, _ = self.add_comment("<p>gone</p>")
        delete_comment_from_feedback(comment_name=name)
        with self.assertRaises(frappe.ValidationError):
            update_comment_in_feedback(comment_name=name, comment="<p>resurrect</p>")

    def test_delete_others_comment_is_rejected(self):
        name, _ = self.add_comment("<p>author's</p>")
        frappe.set_user(self.other_user)
        with self.assertRaises(frappe.PermissionError):
            delete_comment_from_feedback(comment_name=name)

    def test_comment_on_unrelated_doctype_is_not_reachable(self):
        frappe.set_user("Administrator")
        todo = frappe.get_doc({"doctype": "ToDo", "description": "x"}).insert(ignore_permissions=True)
        foreign = frappe.get_doc(
            {
                "doctype": "Comment",
                "comment_type": "Comment",
                "reference_doctype": "ToDo",
                "reference_name": todo.name,
                "content": "<p>not feedback</p>",
            }
        ).insert(ignore_permissions=True)
        frappe.set_user(self.author_user)
        with self.assertRaises(frappe.DoesNotExistError):
            update_comment_in_feedback(comment_name=foreign.name, comment="<p>hijack</p>")
        with self.assertRaises(frappe.ValidationError):
            add_comment_to_feedback(feedback=self.feedback, comment="<p>reply</p>", reply_to=foreign.name)

    def test_mention_creates_only_nextpms_notification(self):
        from erpnext import get_default_company

        from next_pms.next_projects.api.feedback import notify_feedback_nextpms_mentions

        frappe.set_user("Administrator")
        customer = frappe.db.get_value("Customer Feedback", self.feedback, "customer")
        project = (
            frappe.get_doc(
                {
                    "doctype": "Project",
                    "project_name": "Feedback Mention Project",
                    "company": get_default_company(),
                    "customer": customer,
                    "custom_billing_type": "Non-Billable",
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

        frappe.set_user(self.author_user)
        mention_html = (
            f'<p><span class="mention" data-id="{OTHER_USER}" data-label="Other">@Other</span> ping</p>'
        )
        notify_feedback_nextpms_mentions(content=mention_html, feedback=self.feedback, project=project)

        expected_path = f"/next-pms/projects/{project}?tab=feedback"

        self.assertFalse(
            frappe.db.exists(
                "Notification Log",
                {"for_user": OTHER_USER, "document_name": self.feedback, "type": "Mention"},
            )
        )

        nextpms = frappe.get_all(
            "NextPMS Notifications",
            filters={"user": OTHER_USER, "linked_document": self.feedback},
            fields=["url", "title", "label"],
        )
        self.assertEqual(len(nextpms), 1)
        self.assertEqual(nextpms[0].url, expected_path)
        self.assertEqual(nextpms[0].title, "You got a Feedback mention")
        self.assertIn("Feedback Mention Project", nextpms[0].label)
