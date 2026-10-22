# Copyright (c) 2026, rtCamp and Contributors
# See license.txt

import frappe
from frappe.deferred_insert import save_to_db
from frappe.tests import IntegrationTestCase

from next_pms.install import create_default_growth_masters
from next_pms.next_projects.api.growth import (
    add_growth_comment,
    delete_growth_comment,
    get_growth_comments,
    update_growth_comment,
)
from next_pms.tests.utils import make_customer

DOCTYPE = "PMS Growth Initiative"
AUTHOR_USER = "growth.comment.author@example.com"
OTHER_USER = "growth.comment.other@example.com"
NO_ROLE_USER = "growth.comment.norole@example.com"


def mention(user):
    return f'<span class="mention" data-type="mention" data-id="{user}" data-label="{user}">@{user}</span>'


class IntegrationTestGrowthComments(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        create_default_growth_masters()
        cls.make_user(AUTHOR_USER, roles=("Projects User",))
        cls.make_user(OTHER_USER, roles=("Projects User",))
        cls.make_user(NO_ROLE_USER)
        cls.project = frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": f"Growth Comment Project {frappe.generate_hash(length=8)}",
                "customer": make_customer("Growth Test Client"),
            }
        ).insert(ignore_permissions=True)
        cls.growth = cls.make_initiative()
        cls.other_growth = cls.make_initiative()

    @classmethod
    def tearDownClass(cls):
        frappe.set_user("Administrator")
        for name in (cls.growth, cls.other_growth):
            frappe.delete_doc(DOCTYPE, name, force=True, ignore_permissions=True)
        frappe.delete_doc("Project", cls.project.name, force=True, ignore_permissions=True)
        super().tearDownClass()

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
        if frappe.db.exists("Notification Settings", email):
            frappe.db.set_value("Notification Settings", email, "enable_email_notifications", 0)

    @classmethod
    def make_initiative(cls):
        return (
            frappe.get_doc(
                {
                    "doctype": DOCTYPE,
                    "project": cls.project.name,
                    "activity": "Pitch managed hosting",
                    "status": "Ideation",
                    "activity_owner": OTHER_USER,
                }
            )
            .insert(ignore_permissions=True)
            .name
        )

    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.delete(
            "Comment", {"reference_doctype": DOCTYPE, "reference_name": ["in", [self.growth, self.other_growth]]}
        )

    def tearDown(self):
        frappe.set_user("Administrator")
        frappe.db.delete("NextPMS Notifications", {"linked_doctype": DOCTYPE})

    def add_comment(self, comment, user=AUTHOR_USER, growth=None):
        frappe.set_user(user)
        tree = add_growth_comment(name=growth or self.growth, comment=comment)
        return tree, tree[-1]["name"]

    def test_reader_who_is_not_the_owner_can_comment(self):
        tree, _ = self.add_comment("<p>Client asked for a revised estimate.</p>")

        self.assertEqual(len(tree), 1)
        self.assertEqual(tree[0]["user"], AUTHOR_USER)
        self.assertEqual(tree[0]["comment"], "<p>Client asked for a revised estimate.</p>")
        self.assertEqual(get_growth_comments(self.growth), tree)

    def test_reply_nests_under_its_parent(self):
        _, parent = self.add_comment("<p>Parent</p>")
        tree = add_growth_comment(name=self.growth, comment="<p>Reply</p>", reply_to=parent)

        self.assertEqual(len(tree), 1)
        self.assertEqual(tree[0]["reply_count"], 1)
        self.assertEqual(tree[0]["replies"][0]["reply_to"], parent)

    def test_reply_to_a_comment_on_another_initiative_is_rejected(self):
        _, foreign = self.add_comment("<p>Elsewhere</p>", growth=self.other_growth)

        with self.assertRaises(frappe.ValidationError):
            add_growth_comment(name=self.growth, comment="<p>Reply</p>", reply_to=foreign)

    def test_blank_comment_is_rejected(self):
        frappe.set_user(AUTHOR_USER)
        with self.assertRaises(frappe.ValidationError):
            add_growth_comment(name=self.growth, comment="<p> </p>")

    def test_user_without_read_access_cannot_read_or_comment(self):
        frappe.set_user(NO_ROLE_USER)
        with self.assertRaises(frappe.PermissionError):
            get_growth_comments(self.growth)
        with self.assertRaises(frappe.PermissionError):
            add_growth_comment(name=self.growth, comment="<p>Hi</p>")

    def test_only_the_author_can_edit(self):
        _, name = self.add_comment("<p>Draft</p>")

        frappe.set_user(OTHER_USER)
        with self.assertRaises(frappe.PermissionError):
            update_growth_comment(comment_name=name, comment="<p>Hijacked</p>")

        frappe.set_user(AUTHOR_USER)
        tree = update_growth_comment(comment_name=name, comment="<p>Final</p>")
        self.assertEqual(tree[0]["comment"], "<p>Final</p>")
        self.assertTrue(tree[0]["edited"])

    def test_delete_leaves_a_tombstone_that_keeps_replies(self):
        _, parent = self.add_comment("<p>Parent</p>")
        add_growth_comment(name=self.growth, comment="<p>Reply</p>", reply_to=parent)

        frappe.set_user(OTHER_USER)
        with self.assertRaises(frappe.PermissionError):
            delete_growth_comment(comment_name=parent)

        frappe.set_user(AUTHOR_USER)
        tree = delete_growth_comment(comment_name=parent)
        self.assertTrue(tree[0]["deleted"])
        self.assertEqual(tree[0]["comment"], "")
        self.assertEqual(tree[0]["reply_count"], 1)
        with self.assertRaises(frappe.ValidationError):
            update_growth_comment(comment_name=parent, comment="<p>Back</p>")

    def test_comment_on_another_doctype_is_not_found(self):
        frappe.set_user("Administrator")
        project_comment = frappe.get_doc(
            {
                "doctype": "Comment",
                "comment_type": "Comment",
                "reference_doctype": "Project",
                "reference_name": self.project.name,
                "content": "<p>Project note</p>",
            }
        ).insert(ignore_permissions=True)
        self.addCleanup(frappe.delete_doc, "Comment", project_comment.name, force=True, ignore_permissions=True)

        with self.assertRaises(frappe.DoesNotExistError):
            delete_growth_comment(comment_name=project_comment.name)

    def test_mentioned_users_are_notified_except_the_author(self):
        self.add_comment(f"<p>{mention(OTHER_USER)} {mention(AUTHOR_USER)} please review</p>")
        frappe.set_user("Administrator")
        save_to_db()

        notifications = frappe.get_all(
            "NextPMS Notifications",
            filters={"linked_document": self.growth, "title": "You got a Growth mention"},
            fields=["user", "url"],
        )
        self.assertEqual([n.user for n in notifications], [OTHER_USER])
        self.assertEqual(
            notifications[0].url,
            f"/next-pms/projects/{self.project.name}?tab=growth&growth={self.growth}",
        )
