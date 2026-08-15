from unittest.mock import patch

import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.next_pms.notifications import send_mention_notifications
from next_pms.timesheet.api.project_status_update import (
    add_comment_to_project_status_update,
    create_project_status_update,
    delete_comment_from_project_status_update,
    delete_project_status_update,
    get_project_status_update,
    get_project_status_updates_by_project,
    update_comment_in_project_status_update,
    update_project_status_update,
)

AUTHOR_USER = "psu.author@example.com"
OTHER_USER = "psu.other@example.com"
# Holds no Projects role, so the endpoints' only_for gate must reject it.
NO_ROLE_USER = "psu.norole@example.com"
# Holds Projects User: allowed through the API, but must still be denied direct
# (permission-checked) Frappe CRUD, since the doctype grants the role no perms.
PROJECTS_USER = "psu.projectsuser@example.com"


def _find_comment(comments: list[dict], name: str) -> dict | None:
    """Depth-first search for a comment (by row name) in the nested reply tree."""
    for comment in comments:
        if comment["name"] == name:
            return comment
        found = _find_comment(comment.get("replies", []), name)
        if found:
            return found
    return None


class TestProjectStatusUpdateComments(IntegrationTestCase):
    """Cover the Project Status Update CRUD + threaded comment endpoints.

    Deleting a comment is a soft delete: the deleted flag is set and
    deleted_at recorded while the author and the thread structure (child
    comments) are preserved; the serialized content is blanked so deleted text
    never reaches the client. Editing a comment stores the new content verbatim
    and ticks the edited flag. A deleted comment can no longer be edited or
    deleted again.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.project = cls._make_project()

        # Projects Manager clears the ROLES gate on the endpoints. The doctype
        # itself grants no CRUD to this role; writes succeed only because the
        # endpoints run with ignore_permissions, so the API is the sole gate.
        cls.author_user = cls._make_user(AUTHOR_USER, roles=("Projects Manager",))
        cls.other_user = cls._make_user(OTHER_USER, roles=("Projects Manager",))
        cls.no_role_user = cls._make_user(NO_ROLE_USER)
        cls.projects_user = cls._make_user(PROJECTS_USER, roles=("Projects User",))

    @classmethod
    def _make_user(cls, email, roles=()):
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
    def _make_project(cls):
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
        project = frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": "Comment Thread Project",
                "company": cls.company,
                "customer": customer,
                "custom_billing_type": "Non-Billable",
            }
        ).insert(ignore_permissions=True)
        return project.name

    def setUp(self):
        frappe.set_user("Administrator")

    def tearDown(self):
        frappe.set_user("Administrator")

    def _make_update(self, title="Status Update", status="Draft"):
        return create_project_status_update(
            project=self.project,
            title=title,
            description="<p>body</p>",
            status=status,
        )

    def _last_comment_name(self, update_name):
        doc = frappe.get_doc("Project Status Update", update_name)
        return doc.comments[-1].name

    def _add_comment(self, update_name, comment, reply_to=None):
        add_comment_to_project_status_update(name=update_name, comment=comment, reply_to=reply_to)
        return self._last_comment_name(update_name)

    def test_create_returns_details_with_empty_comments(self):
        result = self._make_update(title="Create-only Update")
        self.assertEqual(result["title"], "Create-only Update")
        self.assertEqual(result["project"], self.project)
        self.assertEqual(result["status"], "Draft")
        self.assertEqual(result["comments"], [])

    def test_get_by_name(self):
        created = self._make_update()
        fetched = get_project_status_update(name=created["name"])
        self.assertEqual(fetched["name"], created["name"])
        self.assertEqual(fetched["title"], created["title"])

    def test_get_by_project_and_author_filter(self):
        created = self._make_update(title="Findable Update")
        results = get_project_status_updates_by_project(project=self.project)
        self.assertIn(created["name"], {r["name"] for r in results})

        # owner is Administrator here; filtering by a different author excludes it.
        filtered = get_project_status_updates_by_project(project=self.project, author=AUTHOR_USER)
        self.assertNotIn(created["name"], {r["name"] for r in filtered})

    def test_update_fields(self):
        created = self._make_update()
        updated = update_project_status_update(
            name=created["name"],
            title="Updated Title",
            description="<p>new</p>",
            status="Review",
        )
        self.assertEqual(updated["title"], "Updated Title")
        self.assertEqual(updated["description"], "<p>new</p>")
        self.assertEqual(updated["status"], "Review")

    def test_add_root_comment(self):
        created = self._make_update()
        result = add_comment_to_project_status_update(name=created["name"], comment="<p>root comment</p>")
        self.assertEqual(len(result["comments"]), 1)
        root = result["comments"][0]
        self.assertEqual(root["comment"], "<p>root comment</p>")
        self.assertIsNone(root["reply_to"])
        self.assertEqual(root["reply_count"], 0)

    def test_role_user_can_write_through_api(self):
        # The doctype grants Projects Manager no CRUD, yet a non-admin holder of
        # the role can create and comment because the endpoints run with
        # ignore_permissions. This is the API-only access model.
        frappe.set_user(AUTHOR_USER)

        created = self._make_update(title="Author-created Update")
        self.assertEqual(created["owner"], AUTHOR_USER)

        result = add_comment_to_project_status_update(name=created["name"], comment="<p>by author</p>")
        self.assertEqual(len(result["comments"]), 1)
        self.assertEqual(result["comments"][0]["user"], AUTHOR_USER)

    def test_add_reply_and_reply_chain_nesting(self):
        created = self._make_update()
        root = self._add_comment(created["name"], "<p>A root</p>")
        reply = self._add_comment(created["name"], "<p>B reply</p>", reply_to=root)
        nested = self._add_comment(created["name"], "<p>C reply-to-reply</p>", reply_to=reply)

        details = get_project_status_update(name=created["name"])
        self.assertEqual(len(details["comments"]), 1)

        root_node = details["comments"][0]
        self.assertEqual(root_node["name"], root)
        self.assertEqual(root_node["reply_count"], 1)

        reply_node = root_node["replies"][0]
        self.assertEqual(reply_node["name"], reply)
        self.assertEqual(reply_node["reply_to"], root)
        self.assertEqual(reply_node["reply_count"], 1)

        nested_node = reply_node["replies"][0]
        self.assertEqual(nested_node["name"], nested)
        self.assertEqual(nested_node["reply_to"], reply)

    def test_add_reply_to_missing_parent_throws(self):
        created = self._make_update()
        with self.assertRaises(frappe.exceptions.ValidationError):
            add_comment_to_project_status_update(
                name=created["name"], comment="<p>orphan</p>", reply_to="does-not-exist"
            )

    def test_update_comment_stores_content_verbatim_and_flags_edited(self):
        created = self._make_update()
        root = self._add_comment(created["name"], "<p>before</p>")

        # A fresh comment is not flagged as edited.
        self.assertFalse(get_project_status_update(name=created["name"])["comments"][0]["edited"])

        result = update_comment_in_project_status_update(
            name=created["name"], comment="<p>after</p>", comment_name=root
        )
        edited = result["comments"][0]
        self.assertEqual(edited["comment"], "<p>after</p>")
        self.assertTrue(edited["edited"])

    def test_repeated_edits_keep_content_verbatim(self):
        created = self._make_update()
        root = self._add_comment(created["name"], "<p>v1</p>")

        update_comment_in_project_status_update(name=created["name"], comment="<p>v2</p>", comment_name=root)
        second = update_comment_in_project_status_update(name=created["name"], comment="<p>v3</p>", comment_name=root)

        edited = second["comments"][0]
        self.assertEqual(edited["comment"], "<p>v3</p>")
        self.assertTrue(edited["edited"])

    def test_update_comment_requires_comment_name(self):
        created = self._make_update()
        with self.assertRaises(frappe.exceptions.ValidationError):
            update_comment_in_project_status_update(name=created["name"], comment="<p>x</p>")

    def test_delete_soft_deletes_and_keeps_author(self):
        created = self._make_update()
        frappe.set_user(AUTHOR_USER)
        root = self._add_comment(created["name"], "<p>to be deleted</p>")

        result = delete_comment_from_project_status_update(name=created["name"], comment_name=root)

        # The row survives (soft delete) — still exactly one comment.
        self.assertEqual(len(result["comments"]), 1)
        deleted = result["comments"][0]
        self.assertEqual(deleted["name"], root)
        # Flagged as deleted with a timestamp; content is blanked out.
        self.assertTrue(deleted["deleted"])
        self.assertIsNotNone(deleted["deleted_at"])
        self.assertEqual(deleted["comment"], "")
        # Author and identity metadata are preserved.
        self.assertEqual(deleted["user"], AUTHOR_USER)

    def test_delete_parent_keeps_child_comments(self):
        created = self._make_update()
        root = self._add_comment(created["name"], "<p>A root</p>")
        reply = self._add_comment(created["name"], "<p>B reply</p>", reply_to=root)
        nested = self._add_comment(created["name"], "<p>C reply-to-reply</p>", reply_to=reply)

        # Delete the middle comment (B); its subtree (C) must stay intact.
        delete_comment_from_project_status_update(name=created["name"], comment_name=reply)

        details = get_project_status_update(name=created["name"])
        deleted_reply = _find_comment(details["comments"], reply)
        self.assertIsNotNone(deleted_reply)
        self.assertTrue(deleted_reply["deleted"])
        self.assertEqual(deleted_reply["comment"], "")
        self.assertEqual(deleted_reply["reply_to"], root)

        # The child of the deleted comment survives unchanged.
        nested_node = _find_comment(details["comments"], nested)
        self.assertIsNotNone(nested_node)
        self.assertEqual(nested_node["comment"], "<p>C reply-to-reply</p>")
        self.assertEqual(nested_node["reply_to"], reply)

        # Nothing was removed from the child table.
        doc = frappe.get_doc("Project Status Update", created["name"])
        self.assertEqual(len(doc.comments), 3)

    def test_delete_comment_by_non_author_is_forbidden(self):
        created = self._make_update()
        frappe.set_user(AUTHOR_USER)
        root = self._add_comment(created["name"], "<p>author's comment</p>")

        frappe.set_user(OTHER_USER)
        with self.assertRaises(frappe.PermissionError):
            delete_comment_from_project_status_update(name=created["name"], comment_name=root)

    def test_update_comment_by_non_author_is_forbidden(self):
        created = self._make_update()
        frappe.set_user(AUTHOR_USER)
        root = self._add_comment(created["name"], "<p>author's comment</p>")

        frappe.set_user(OTHER_USER)
        with self.assertRaises(frappe.PermissionError):
            update_comment_in_project_status_update(name=created["name"], comment="<p>hijack</p>", comment_name=root)

    def test_editing_a_deleted_comment_is_forbidden(self):
        created = self._make_update()
        frappe.set_user(AUTHOR_USER)
        root = self._add_comment(created["name"], "<p>to be deleted</p>")
        delete_comment_from_project_status_update(name=created["name"], comment_name=root)

        with self.assertRaises(frappe.exceptions.ValidationError):
            update_comment_in_project_status_update(name=created["name"], comment="<p>resurrect</p>", comment_name=root)

    def test_deleting_a_deleted_comment_is_forbidden(self):
        created = self._make_update()
        frappe.set_user(AUTHOR_USER)
        root = self._add_comment(created["name"], "<p>to be deleted</p>")
        delete_comment_from_project_status_update(name=created["name"], comment_name=root)

        with self.assertRaises(frappe.exceptions.ValidationError):
            delete_comment_from_project_status_update(name=created["name"], comment_name=root)

    def test_user_without_projects_role_is_rejected_by_endpoints(self):
        # A user holding neither Projects Manager nor Projects User must be
        # blocked at the only_for gate on every endpoint - read and write.
        created = self._make_update()
        comment_name = self._add_comment(created["name"], "<p>seed</p>")

        frappe.set_user(NO_ROLE_USER)
        with self.assertRaises(frappe.PermissionError):
            get_project_status_update(name=created["name"])
        with self.assertRaises(frappe.PermissionError):
            create_project_status_update(project=self.project, title="nope", description="<p>nope</p>", status="Draft")
        with self.assertRaises(frappe.PermissionError):
            add_comment_to_project_status_update(name=created["name"], comment="<p>nope</p>")
        with self.assertRaises(frappe.PermissionError):
            update_comment_in_project_status_update(
                name=created["name"], comment="<p>nope</p>", comment_name=comment_name
            )
        with self.assertRaises(frappe.PermissionError):
            delete_comment_from_project_status_update(name=created["name"], comment_name=comment_name)
        with self.assertRaises(frappe.PermissionError):
            delete_project_status_update(name=created["name"])

    def test_author_can_delete_update(self):
        frappe.set_user(AUTHOR_USER)
        created = self._make_update(title="To be deleted")

        delete_project_status_update(name=created["name"])

        self.assertFalse(frappe.db.exists("Project Status Update", created["name"]))

    def test_delete_update_by_non_author_is_forbidden(self):
        frappe.set_user(AUTHOR_USER)
        created = self._make_update(title="Author's update")

        frappe.set_user(OTHER_USER)
        with self.assertRaises(frappe.PermissionError):
            delete_project_status_update(name=created["name"])

        self.assertTrue(frappe.db.exists("Project Status Update", created["name"]))

    def test_mention_notifies_user_and_links_to_notes_page(self):
        frappe.set_user(AUTHOR_USER)
        created = self._make_update(title="Weekly note")
        mention_html = f'<p><span class="mention" data-id="{OTHER_USER}" data-label="Other">@Other</span> ping</p>'
        expected_path = f"/next-pms/projects/{self.project}?tab=notes&note={created['name']}"
        with patch("frappe.sendmail"):
            send_mention_notifications(
                content=mention_html,
                title="You got a Notes mention",
                label=(
                    f"{frappe.utils.get_fullname(AUTHOR_USER)} mentioned you in "
                    "Weekly note from Comment Thread Project project"
                ),
                linked_doctype="Project Status Update",
                linked_document=created["name"],
                url_path=expected_path,
            )
        expected_url = frappe.utils.get_url(expected_path)

        logs = frappe.get_all(
            "Notification Log",
            filters={"for_user": OTHER_USER, "document_name": created["name"], "type": "Mention"},
            fields=["link", "subject", "email_header"],
        )
        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0].link, expected_url)
        self.assertEqual(logs[0].email_header, "You got a Notes mention")
        self.assertIn("Weekly note", logs[0].subject)
        self.assertIn("Comment Thread Project", logs[0].subject)

        nextpms = frappe.get_all(
            "NextPMS Notifications",
            filters={"user": OTHER_USER, "linked_document": created["name"]},
            fields=["url", "title", "label"],
        )
        self.assertEqual(len(nextpms), 1)
        self.assertEqual(nextpms[0].url, expected_path)
        self.assertEqual(nextpms[0].title, "You got a Notes mention")
        self.assertEqual(nextpms[0].label, logs[0].subject)
        self.assertIn("Weekly note", nextpms[0].label)
        self.assertIn("Comment Thread Project", nextpms[0].label)

    def _assert_direct_crud_forbidden(self, user):
        # Acting as `user` through the permission-checked ORM (the Desk path),
        # every write must raise PermissionError because the doctype grants the
        # role no create/write/delete. This is what forces all access through
        # the API, where only_for + author-only ownership checks apply.
        created = self._make_update()
        frappe.set_user(user)

        with self.assertRaises(frappe.PermissionError):
            new_update = frappe.new_doc("Project Status Update")
            new_update.project = self.project
            new_update.title = "direct create"
            new_update.insert()

        with self.assertRaises(frappe.PermissionError):
            doc = frappe.get_doc("Project Status Update", created["name"])
            doc.title = "direct edit"
            doc.save()

        with self.assertRaises(frappe.PermissionError):
            frappe.get_doc("Project Status Update", created["name"]).delete()

    def test_projects_manager_cannot_edit_via_direct_crud(self):
        self._assert_direct_crud_forbidden(AUTHOR_USER)

    def test_projects_user_cannot_edit_via_direct_crud(self):
        self._assert_direct_crud_forbidden(PROJECTS_USER)
