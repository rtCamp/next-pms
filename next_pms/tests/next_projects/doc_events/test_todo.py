import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, nowdate


class TestLinkedTodoEvents(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.project = cls.make_project("Linked ToDo Events Project")
        cls.other_project = cls.make_project("Linked ToDo Events Other Project")

    @staticmethod
    def make_project(project_name):
        return frappe.get_doc({"doctype": "Project", "project_name": project_name}).insert(ignore_permissions=True).name

    def make_todo(self):
        return frappe.get_doc(
            {
                "doctype": "ToDo",
                "description": "Follow up",
                "reference_type": "Project",
                "reference_name": self.project,
            }
        ).insert(ignore_permissions=True)

    def make_linked_todo(self):
        todo = self.make_todo()
        milestone = frappe.get_doc(
            {
                "doctype": "Project Timeline Item",
                "title": "Launch",
                "project": self.project,
                "type": "Milestone",
                "start_date": nowdate(),
                "planned_end_date": add_days(nowdate(), 5),
                "item_owner": "Administrator",
                "linked_todos": [{"todo": todo.name}],
            }
        ).insert(ignore_permissions=True)
        return todo, milestone

    def test_deleting_linked_todo_drops_the_link_only(self):
        todo, milestone = self.make_linked_todo()
        modified = frappe.db.get_value(milestone.doctype, milestone.name, "modified")

        frappe.delete_doc("ToDo", todo.name, ignore_permissions=True)

        self.assertFalse(frappe.db.exists("ToDo", todo.name))
        self.assertFalse(frappe.db.exists("PMS Linked ToDo", {"todo": todo.name}))
        self.assertEqual(frappe.get_doc(milestone.doctype, milestone.name).linked_todos, [])
        self.assertEqual(frappe.db.get_value(milestone.doctype, milestone.name, "modified"), modified)

    def test_deleting_unlinked_todo_still_works(self):
        todo = self.make_todo()
        frappe.delete_doc("ToDo", todo.name, ignore_permissions=True)
        self.assertFalse(frappe.db.exists("ToDo", todo.name))

    def test_linked_todo_cannot_move_to_another_project(self):
        todo, _ = self.make_linked_todo()
        todo.reference_name = self.other_project
        with self.assertRaisesRegex(frappe.ValidationError, "Unlink it before moving it"):
            todo.save(ignore_permissions=True)

    def test_linked_todo_cannot_drop_its_project_reference(self):
        todo, _ = self.make_linked_todo()
        todo.reference_type = None
        todo.reference_name = None
        with self.assertRaisesRegex(frappe.ValidationError, "Unlink it before moving it"):
            todo.save(ignore_permissions=True)

    def test_unlinked_todo_can_move_to_another_project(self):
        todo = self.make_todo()
        todo.reference_name = self.other_project
        todo.save(ignore_permissions=True)
        self.assertEqual(frappe.db.get_value("ToDo", todo.name, "reference_name"), self.other_project)

    def test_linked_todo_other_edits_are_allowed(self):
        todo, milestone = self.make_linked_todo()
        todo.status = "Closed"
        todo.description = "Done"
        todo.save(ignore_permissions=True)
        self.assertEqual(frappe.db.get_value("ToDo", todo.name, "status"), "Closed")
        self.assertEqual(frappe.db.get_value(milestone.doctype, milestone.name, "is_complete"), 0)
