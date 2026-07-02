import frappe
from erpnext import get_default_company
from frappe.tests import IntegrationTestCase

from next_pms.timesheet.api.project_status_update import (
    add_comment_to_project_status_update,
    create_project_status_update,
    delete_comment_from_project_status_update,
    get_project_status_update,
    get_project_status_updates_by_project,
    update_comment_in_project_status_update,
    update_project_status_update,
)

AUTHOR_USER = "psu.author@example.com"
OTHER_USER = "psu.other@example.com"


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

    Deleting a comment is a soft delete: the comment content is replaced with
    a "deleted at <timestamp>" tombstone while the author and the thread
    structure (child comments) are preserved. Editing a comment appends an
    "edited at <timestamp>" marker to the content instead of replacing it,
    and repeated edits replace the previous marker rather than stacking.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.company = get_default_company()
        cls.project = cls._make_project()

        # Projects Manager clears both the ROLES gate on the endpoints and the
        # doctype-level permissions on Project Status Update.
        cls.author_user = cls._make_user(AUTHOR_USER)
        cls.other_user = cls._make_user(OTHER_USER)

    @classmethod
    def _make_user(cls, email):
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
        frappe.get_doc("User", email).add_roles("Projects Manager")
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

    def test_update_comment_content_appends_edited_marker(self):
        created = self._make_update()
        root = self._add_comment(created["name"], "<p>before</p>")
        result = update_comment_in_project_status_update(
            name=created["name"], comment="<p>after</p>", comment_name=root
        )
        edited = result["comments"][0]["comment"]
        self.assertTrue(edited.startswith("<p>after</p>\n\nedited at "))

    def test_repeated_edits_do_not_stack_markers(self):
        created = self._make_update()
        root = self._add_comment(created["name"], "<p>v1</p>")

        first = update_comment_in_project_status_update(name=created["name"], comment="<p>v2</p>", comment_name=root)
        edited_once = first["comments"][0]["comment"]

        # Simulate the client sending back the stored content (marker included).
        second = update_comment_in_project_status_update(name=created["name"], comment=edited_once, comment_name=root)
        edited_twice = second["comments"][0]["comment"]

        self.assertTrue(edited_twice.startswith("<p>v2</p>\n\nedited at "))
        # Only a single trailing marker remains, not one per edit.
        self.assertEqual(edited_twice.count("edited at "), 1)

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
        # Content is replaced with a "[deleted at <timestamp>]" tombstone.
        self.assertTrue(deleted["comment"].startswith("[deleted at "))
        self.assertTrue(deleted["comment"].endswith("]"))
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
        self.assertTrue(deleted_reply["comment"].startswith("[deleted at "))
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
