import frappe
from frappe.permissions import add_user_permission, update_permission_property
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, nowdate

from next_pms.install import create_default_growth_masters
from next_pms.next_projects.api.project_timeline_item import mark_timeline_item_complete
from next_pms.next_projects.api.todo import (
    create_linked_todo,
    create_project_todo,
    delete_project_todo,
    get_linkable_records,
    get_project_todos,
    link_todo,
    unlink_todo,
    update_project_todo,
)

PTI = "Project Timeline Item"
GROWTH = "PMS Growth Initiative"
MANAGER = "test.linked.todo.pm@example.com"
GATED = "test.linked.todo.pu@example.com"
OUTSIDER = "test.linked.todo.emp@example.com"
RESTRICTED = "test.linked.todo.restricted@example.com"


class LinkedTodoTestCase(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        create_default_growth_masters()
        for ptype in ("create", "write", "delete"):
            update_permission_property("ToDo", "All", 0, ptype, 0)
        cls.make_user(MANAGER, ["Projects Manager"])
        cls.make_user(GATED, ["Projects User"])
        cls.make_user(OUTSIDER, ["Employee"])
        cls.make_user(RESTRICTED, ["Projects Manager"])
        cls.project = cls.make_project("Linked ToDo Project")
        cls.other_project = cls.make_project("Linked ToDo Other Project")
        if not frappe.db.exists("User Permission", {"user": RESTRICTED, "allow": "Project"}):
            add_user_permission("Project", cls.other_project, RESTRICTED, applicable_for="Project")
        frappe.clear_cache()

    def tearDown(self):
        frappe.set_user("Administrator")

    @staticmethod
    def make_user(email, roles):
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
        frappe.get_doc("User", email).add_roles(*roles)

    @staticmethod
    def make_project(project_name):
        return frappe.get_doc({"doctype": "Project", "project_name": project_name}).insert(ignore_permissions=True).name

    def make_timeline_item(self, type="Milestone", project=None, title="Launch"):
        return frappe.get_doc(
            {
                "doctype": PTI,
                "title": title,
                "project": project or self.project,
                "type": type,
                "start_date": nowdate(),
                "planned_end_date": add_days(nowdate(), 5),
                "item_owner": "Administrator",
            }
        ).insert(ignore_permissions=True)

    def make_initiative(self, activity_owner=MANAGER, project=None, activity="Expand to mobile"):
        return frappe.get_doc(
            {
                "doctype": GROWTH,
                "project": project or self.project,
                "activity": activity,
                "status": "Ideation",
                "activity_owner": activity_owner,
                "billable_outcome": 0,
            }
        ).insert(ignore_permissions=True)

    def make_todo(self, project=None, allocated_to=MANAGER, reference_type="Project"):
        return frappe.get_doc(
            {
                "doctype": "ToDo",
                "description": "Prepare deck",
                "allocated_to": allocated_to,
                "reference_type": reference_type,
                "reference_name": project or self.project,
            }
        ).insert(ignore_permissions=True)

    def linked_todos(self, doc):
        return [row.todo for row in frappe.get_doc(doc.doctype, doc.name).linked_todos]


class TestLinkedTodoValidation(LinkedTodoTestCase):
    def test_owner_saves_with_a_project_todo(self):
        todo = self.make_todo()
        for owner in (self.make_timeline_item(), self.make_initiative()):
            other = self.make_todo()
            owner.append("linked_todos", {"todo": other.name})
            owner.save(ignore_permissions=True)
            self.assertEqual(self.linked_todos(owner), [other.name])
        self.assertTrue(frappe.db.exists("ToDo", todo.name))

    def test_resaving_owner_keeps_its_own_links_valid(self):
        milestone = self.make_timeline_item()
        todo = self.make_todo()
        milestone.append("linked_todos", {"todo": todo.name})
        milestone.save(ignore_permissions=True)
        milestone.title = "Launch v2"
        milestone.save(ignore_permissions=True)
        self.assertEqual(self.linked_todos(milestone), [todo.name])

    def test_duplicate_todo_in_one_owner_is_rejected(self):
        milestone = self.make_timeline_item()
        todo = self.make_todo()
        milestone.append("linked_todos", {"todo": todo.name})
        milestone.append("linked_todos", {"todo": todo.name})
        with self.assertRaisesRegex(frappe.ValidationError, "linked more than once"):
            milestone.save(ignore_permissions=True)

    def test_todo_of_another_project_is_rejected(self):
        initiative = self.make_initiative()
        initiative.append("linked_todos", {"todo": self.make_todo(project=self.other_project).name})
        with self.assertRaisesRegex(frappe.ValidationError, "does not belong to project"):
            initiative.save(ignore_permissions=True)

    def test_todo_not_referencing_a_project_is_rejected(self):
        milestone = self.make_timeline_item()
        todo = frappe.get_doc({"doctype": "ToDo", "description": "Loose"}).insert(ignore_permissions=True)
        milestone.append("linked_todos", {"todo": todo.name})
        with self.assertRaisesRegex(frappe.ValidationError, "does not belong to project"):
            milestone.save(ignore_permissions=True)

    def test_missing_todo_is_rejected(self):
        milestone = self.make_timeline_item()
        milestone.append("linked_todos", {"todo": "no-such-todo"})
        with self.assertRaises(frappe.LinkValidationError):
            milestone.save(ignore_permissions=True)

    def test_todo_linked_to_another_owner_is_rejected(self):
        todo = self.make_todo()
        milestone = self.make_timeline_item()
        milestone.append("linked_todos", {"todo": todo.name})
        milestone.save(ignore_permissions=True)

        for owner in (self.make_timeline_item(type="Touchpoint"), self.make_initiative()):
            owner.append("linked_todos", {"todo": todo.name})
            with self.assertRaisesRegex(frappe.ValidationError, "already linked to"):
                owner.save(ignore_permissions=True)

    def test_database_rejects_a_second_owner_row(self):
        todo = self.make_todo()
        milestone = self.make_timeline_item()
        milestone.append("linked_todos", {"todo": todo.name})
        milestone.save(ignore_permissions=True)

        row = frappe.get_doc(
            {
                "doctype": "PMS Linked ToDo",
                "parent": self.make_initiative().name,
                "parenttype": GROWTH,
                "parentfield": "linked_todos",
                "todo": todo.name,
            }
        )
        with self.assertRaises(frappe.UniqueValidationError):
            row.db_insert()

    def test_saving_owner_with_another_users_project_todo_is_allowed(self):
        initiative = self.make_initiative()
        todo = self.make_todo(allocated_to=OUTSIDER)

        frappe.set_user(MANAGER)
        initiative = frappe.get_doc(GROWTH, initiative.name)
        initiative.append("linked_todos", {"todo": todo.name})
        initiative.save()
        self.assertEqual(self.linked_todos(initiative), [todo.name])

    def test_saving_owner_with_a_new_link_needs_read_on_its_project(self):
        initiative = self.make_initiative(activity_owner=RESTRICTED)
        todo = self.make_todo()

        frappe.set_user(RESTRICTED)
        initiative = frappe.get_doc(GROWTH, initiative.name)
        initiative.append("linked_todos", {"todo": todo.name})
        with self.assertRaises(frappe.PermissionError):
            initiative.save()

    def test_reassigned_todo_does_not_block_unrelated_owner_edits(self):
        initiative = self.make_initiative()
        todo = self.make_todo()
        initiative.append("linked_todos", {"todo": todo.name})
        initiative.save(ignore_permissions=True)
        frappe.db.set_value("ToDo", todo.name, "allocated_to", OUTSIDER)

        frappe.set_user(MANAGER)
        initiative = frappe.get_doc(GROWTH, initiative.name)
        initiative.activity = "Expand to tablets"
        initiative.save()
        self.assertEqual(self.linked_todos(initiative), [todo.name])

    def test_moving_owner_to_another_project_with_links_is_rejected(self):
        initiative = self.make_initiative()
        initiative.append("linked_todos", {"todo": self.make_todo().name})
        initiative.save(ignore_permissions=True)
        initiative.project = self.other_project
        with self.assertRaisesRegex(frappe.ValidationError, "does not belong to project"):
            initiative.save(ignore_permissions=True)


class TestCreateLinkedTodo(LinkedTodoTestCase):
    def test_creates_project_todo_linked_to_owner(self):
        frappe.set_user(MANAGER)
        for owner in (self.make_timeline_item(), self.make_initiative()):
            todo = create_linked_todo(
                owner.doctype,
                owner.name,
                {"description": "Kick-off", "allocated_to": MANAGER, "priority": "High", "status": "Open"},
            )
            self.assertEqual((todo["reference_type"], todo["reference_name"]), ("Project", self.project))
            self.assertEqual((todo["priority"], todo["allocated_to"]), ("High", MANAGER))
            self.assertEqual(self.linked_todos(owner), [todo["name"]])

    def test_creator_can_assign_the_todo_to_someone_else(self):
        initiative = self.make_initiative()
        frappe.set_user(MANAGER)
        todo = create_linked_todo(GROWTH, initiative.name, {"description": "Hand-off", "allocated_to": GATED})
        self.assertEqual((todo["allocated_to"], todo["assigned_by"]), (GATED, MANAGER))
        self.assertEqual(self.linked_todos(initiative), [todo["name"]])

    def test_accepts_json_and_ignores_reference_overrides(self):
        milestone = self.make_timeline_item()
        todo = create_linked_todo(
            PTI,
            milestone.name,
            frappe.as_json(
                {
                    "description": "Kick-off",
                    "reference_type": "Task",
                    "reference_name": self.other_project,
                    "owner": OUTSIDER,
                }
            ),
        )
        self.assertEqual((todo["reference_type"], todo["reference_name"]), ("Project", self.project))
        self.assertEqual(todo["owner"], "Administrator")

    def test_user_who_cannot_edit_owner_creates_nothing(self):
        milestone = self.make_timeline_item()
        before = frappe.db.count("ToDo")
        frappe.set_user(GATED)
        with self.assertRaises(frappe.PermissionError):
            create_linked_todo(PTI, milestone.name, {"description": "Sneaky"})
        frappe.set_user("Administrator")
        self.assertEqual(frappe.db.count("ToDo"), before)

    def test_unsupported_doctype_is_rejected(self):
        with self.assertRaisesRegex(frappe.ValidationError, "cannot be linked"):
            create_linked_todo("Project", self.project, {"description": "x"})


class TestLinkAndUnlinkTodo(LinkedTodoTestCase):
    def test_links_todo_to_milestone_touchpoint_and_initiative(self):
        frappe.set_user(MANAGER)
        for owner in (
            self.make_timeline_item(),
            self.make_timeline_item(type="Touchpoint"),
            self.make_initiative(),
        ):
            todo = self.make_todo()
            self.assertEqual(
                link_todo(todo.name, owner.doctype, owner.name),
                {"todo": todo.name, "doctype": owner.doctype, "name": owner.name},
            )
            self.assertEqual(self.linked_todos(owner), [todo.name])

    def test_linking_twice_to_same_owner_is_a_no_op(self):
        milestone = self.make_timeline_item()
        todo = self.make_todo()
        link_todo(todo.name, PTI, milestone.name)
        modified = frappe.db.get_value(PTI, milestone.name, "modified")
        link_todo(todo.name, PTI, milestone.name)
        self.assertEqual(self.linked_todos(milestone), [todo.name])
        self.assertEqual(frappe.db.get_value(PTI, milestone.name, "modified"), modified)

    def test_linking_to_another_owner_moves_the_todo(self):
        milestone = self.make_timeline_item()
        initiative = self.make_initiative()
        todo = self.make_todo()
        link_todo(todo.name, PTI, milestone.name)
        link_todo(todo.name, GROWTH, initiative.name)
        self.assertEqual(self.linked_todos(milestone), [])
        self.assertEqual(self.linked_todos(initiative), [todo.name])

    def test_todo_of_another_project_cannot_be_linked(self):
        milestone = self.make_timeline_item()
        with self.assertRaisesRegex(frappe.ValidationError, "does not belong to project"):
            link_todo(self.make_todo(project=self.other_project).name, PTI, milestone.name)

    def test_owner_write_permission_gates_linking(self):
        milestone = self.make_timeline_item()
        own_initiative = self.make_initiative(activity_owner=GATED)
        others_initiative = self.make_initiative(activity_owner=MANAGER)
        todo = self.make_todo(allocated_to=GATED)

        frappe.set_user(GATED)
        with self.assertRaises(frappe.PermissionError):
            link_todo(todo.name, PTI, milestone.name)
        with self.assertRaises(frappe.PermissionError):
            link_todo(todo.name, GROWTH, others_initiative.name)
        link_todo(todo.name, GROWTH, own_initiative.name)
        self.assertEqual(self.linked_todos(own_initiative), [todo.name])

    def test_moving_needs_write_on_the_current_owner_too(self):
        others_initiative = self.make_initiative(activity_owner=MANAGER)
        own_initiative = self.make_initiative(activity_owner=GATED)
        todo = self.make_todo(allocated_to=GATED)
        link_todo(todo.name, GROWTH, others_initiative.name)

        frappe.set_user(GATED)
        with self.assertRaises(frappe.PermissionError):
            link_todo(todo.name, GROWTH, own_initiative.name)

    def test_another_users_project_todo_can_be_linked_and_unlinked(self):
        milestone = self.make_timeline_item()
        todo = self.make_todo(allocated_to=OUTSIDER)

        frappe.set_user(MANAGER)
        link_todo(todo.name, PTI, milestone.name)
        self.assertEqual(self.linked_todos(milestone), [todo.name])
        unlink_todo(todo.name)
        self.assertEqual(self.linked_todos(milestone), [])

    def test_todo_of_an_unreadable_project_cannot_be_linked_or_unlinked(self):
        milestone = self.make_timeline_item()
        todo = self.make_todo()
        link_todo(todo.name, PTI, milestone.name)

        frappe.set_user(RESTRICTED)
        with self.assertRaises(frappe.PermissionError):
            link_todo(todo.name, PTI, self.make_timeline_item(type="Touchpoint").name)
        with self.assertRaises(frappe.PermissionError):
            unlink_todo(todo.name)

    def test_unlink_keeps_the_todo(self):
        frappe.set_user(MANAGER)
        initiative = self.make_initiative()
        todo = self.make_todo()
        link_todo(todo.name, GROWTH, initiative.name)
        self.assertEqual(unlink_todo(todo.name), {"todo": todo.name})
        self.assertEqual(self.linked_todos(initiative), [])
        self.assertTrue(frappe.db.exists("ToDo", todo.name))

    def test_unlinking_an_unlinked_todo_is_a_no_op(self):
        todo = self.make_todo()
        self.assertEqual(unlink_todo(todo.name), {"todo": todo.name})

    def test_unlink_needs_write_on_the_owner(self):
        milestone = self.make_timeline_item()
        todo = self.make_todo(allocated_to=GATED)
        link_todo(todo.name, PTI, milestone.name)
        frappe.set_user(GATED)
        with self.assertRaises(frappe.PermissionError):
            unlink_todo(todo.name)


class TestProjectTodos(LinkedTodoTestCase):
    def test_lists_every_todo_of_the_project_with_assignee_and_link(self):
        project = self.make_project("Project ToDos Project")
        milestone = self.make_timeline_item(project=project, title="Beta launch")
        touchpoint = self.make_timeline_item(type="Touchpoint", project=project, title="Client sync")
        initiative = self.make_initiative(project=project, activity="Upsell support")
        linked = {owner.name: self.make_todo(project=project).name for owner in (milestone, touchpoint, initiative)}
        for owner in (milestone, touchpoint, initiative):
            link_todo(linked[owner.name], owner.doctype, owner.name)
        unlinked = self.make_todo(project=project, allocated_to=OUTSIDER)
        self.make_todo(project=self.other_project)
        frappe.get_doc({"doctype": "ToDo", "description": "Loose"}).insert(ignore_permissions=True)

        frappe.set_user(GATED)
        todos = {todo.name: todo for todo in get_project_todos(project)}

        self.assertEqual(set(todos), {*linked.values(), unlinked.name})
        self.assertEqual(
            {name: todos[name].linked for name in linked.values()},
            {
                linked[milestone.name]: {
                    "doctype": PTI,
                    "name": milestone.name,
                    "title": "Beta launch",
                    "type": "Milestone",
                },
                linked[touchpoint.name]: {
                    "doctype": PTI,
                    "name": touchpoint.name,
                    "title": "Client sync",
                    "type": "Touchpoint",
                },
                linked[initiative.name]: {
                    "doctype": GROWTH,
                    "name": initiative.name,
                    "title": "Upsell support",
                    "type": "Growth Initiative",
                },
            },
        )
        self.assertNotIn("linked", todos[unlinked.name])
        self.assertEqual(
            todos[unlinked.name].allocated_to_full_name, frappe.db.get_value("User", OUTSIDER, "full_name")
        )
        self.assertEqual(get_project_todos(self.make_project("Project ToDos Empty Project")), [])

    def test_desk_keeps_core_todo_permissions(self):
        todo = self.make_todo(allocated_to=OUTSIDER)

        frappe.set_user(GATED)
        self.assertIn(todo.name, [row.name for row in get_project_todos(self.project)])
        self.assertNotIn(todo.name, frappe.get_list("ToDo", pluck="name", limit_page_length=0))
        self.assertFalse(frappe.has_permission("ToDo", "read", doc=todo.name))

    def test_creates_todo_on_the_project_ignoring_reference_overrides(self):
        frappe.set_user(GATED)
        todo = create_project_todo(
            self.project,
            frappe.as_json(
                {
                    "description": "Kick-off",
                    "allocated_to": OUTSIDER,
                    "priority": "High",
                    "reference_name": self.other_project,
                    "assigned_by": OUTSIDER,
                }
            ),
        )
        self.assertEqual((todo["reference_type"], todo["reference_name"]), ("Project", self.project))
        self.assertEqual((todo["allocated_to"], todo["assigned_by"], todo["owner"]), (OUTSIDER, GATED, GATED))
        self.assertEqual(todo["priority"], "High")

    def test_updates_any_todo_of_the_project(self):
        todo = self.make_todo(allocated_to=OUTSIDER)

        frappe.set_user(GATED)
        updated = update_project_todo(
            todo.name,
            {"description": "Ship deck", "status": "Closed", "reference_name": self.other_project},
        )
        self.assertEqual((updated["description"], updated["status"]), ("Ship deck", "Closed"))
        self.assertEqual(frappe.db.get_value("ToDo", todo.name, "reference_name"), self.project)

    def test_deletes_any_todo_of_the_project(self):
        milestone = self.make_timeline_item()
        todo = self.make_todo(allocated_to=OUTSIDER)
        link_todo(todo.name, PTI, milestone.name)

        frappe.set_user(GATED)
        self.assertEqual(delete_project_todo(todo.name), {"todo": todo.name})
        self.assertFalse(frappe.db.exists("ToDo", todo.name))
        self.assertEqual(self.linked_todos(milestone), [])

    def test_users_who_cannot_open_the_project_page_are_rejected(self):
        todo = self.make_todo()
        for user in (OUTSIDER, RESTRICTED):
            frappe.set_user(user)
            with self.assertRaises(frappe.PermissionError):
                get_project_todos(self.project)
            with self.assertRaises(frappe.PermissionError):
                create_project_todo(self.project, {"description": "Sneaky"})
            with self.assertRaises(frappe.PermissionError):
                update_project_todo(todo.name, {"status": "Closed"})
            with self.assertRaises(frappe.PermissionError):
                delete_project_todo(todo.name)
        frappe.set_user("Administrator")
        self.assertEqual(frappe.db.get_value("ToDo", todo.name, "status"), "Open")

    def test_todo_not_referencing_a_project_is_rejected(self):
        todo = frappe.get_doc({"doctype": "ToDo", "description": "Loose"}).insert(ignore_permissions=True)
        frappe.set_user(GATED)
        with self.assertRaises(frappe.PermissionError):
            update_project_todo(todo.name, {"status": "Closed"})
        with self.assertRaises(frappe.PermissionError):
            delete_project_todo(todo.name)

    def test_unknown_project_is_rejected(self):
        with self.assertRaises(frappe.DoesNotExistError):
            get_project_todos("no-such-project")


class TestLinkableRecords(LinkedTodoTestCase):
    def test_get_linkable_records_lists_what_the_user_can_edit(self):
        project = self.make_project("Linkable Records Project")
        milestone = self.make_timeline_item(project=project, title="M1")
        touchpoint = self.make_timeline_item(type="Touchpoint", project=project, title="T1")
        own = self.make_initiative(activity_owner=GATED, project=project, activity="Own")
        others = self.make_initiative(activity_owner=MANAGER, project=project, activity="Others")
        self.make_timeline_item(project=self.other_project, title="Elsewhere")

        frappe.set_user(MANAGER)
        self.assertEqual(
            {(record["doctype"], record["name"], record["type"]) for record in get_linkable_records(project)},
            {
                (PTI, milestone.name, "Milestone"),
                (PTI, touchpoint.name, "Touchpoint"),
                (GROWTH, own.name, "Growth Initiative"),
                (GROWTH, others.name, "Growth Initiative"),
            },
        )

        frappe.set_user(GATED)
        self.assertEqual(
            get_linkable_records(project),
            [{"doctype": GROWTH, "name": own.name, "title": "Own", "type": "Growth Initiative"}],
        )

    def test_get_linkable_records_rejects_unknown_project(self):
        with self.assertRaises(frappe.DoesNotExistError):
            get_linkable_records("no-such-project")


class TestIndependentLifecycle(LinkedTodoTestCase):
    def test_deleting_owner_keeps_its_todos(self):
        for owner in (self.make_timeline_item(), self.make_initiative()):
            todo = self.make_todo()
            link_todo(todo.name, owner.doctype, owner.name)
            frappe.delete_doc(owner.doctype, owner.name)
            self.assertTrue(frappe.db.exists("ToDo", todo.name))
            self.assertEqual(frappe.db.get_value("ToDo", todo.name, "status"), "Open")
            self.assertFalse(frappe.db.exists("PMS Linked ToDo", {"todo": todo.name}))

    def test_completing_milestone_leaves_todo_open(self):
        milestone = self.make_timeline_item()
        todo = self.make_todo()
        link_todo(todo.name, PTI, milestone.name)
        mark_timeline_item_complete(milestone.name)
        self.assertEqual(frappe.db.get_value("ToDo", todo.name, "status"), "Open")
        self.assertEqual(self.linked_todos(milestone), [todo.name])

    def test_closing_or_deleting_todo_leaves_owner_untouched(self):
        milestone = self.make_timeline_item()
        closed, deleted = self.make_todo(), self.make_todo()
        link_todo(closed.name, PTI, milestone.name)
        link_todo(deleted.name, PTI, milestone.name)

        frappe.get_doc("ToDo", closed.name).update({"status": "Closed"}).save(ignore_permissions=True)
        frappe.delete_doc("ToDo", deleted.name, ignore_permissions=True)

        self.assertEqual(frappe.db.get_value(PTI, milestone.name, "is_complete"), 0)
        self.assertEqual(self.linked_todos(milestone), [closed.name])
