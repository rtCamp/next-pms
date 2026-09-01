from unittest.mock import MagicMock, call, patch

import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import add_days, flt, getdate, nowdate

from next_pms.project_currency.api import project_timesheet_billing_recalculation
from next_pms.project_currency.background_jobs import project_costing
from next_pms.project_currency.overrides.timesheet import TimesheetOverwrite
from next_pms.tests.utils import make_employee


class TestCostingJobEnqueue(IntegrationTestCase):
    def test_empty_affected_records_do_not_enqueue(self):
        """Skip enqueueing a costing job when no task or project actually changed."""
        with patch.object(project_costing.frappe, "enqueue") as enqueue:
            project_costing.enqueue_update_task_and_project(tasks=[], projects=[])

        enqueue.assert_not_called()

    def test_same_affected_records_are_enqueued_for_every_save(self):
        """Every committed save needs a job; deduplication can discard a concurrent update."""
        with (
            patch.object(project_costing, "get_costing_queue", return_value="pms_costings_queue"),
            patch.object(project_costing.frappe, "enqueue") as enqueue,
        ):
            project_costing.enqueue_update_task_and_project(tasks=["TASK-1"], projects=["PROJ-1"])
            project_costing.enqueue_update_task_and_project(tasks=["TASK-1"], projects=["PROJ-1"])

        self.assertEqual(enqueue.call_count, 2)
        for enqueue_call in enqueue.call_args_list:
            self.assertIs(enqueue_call.args[0], project_costing.update_task_and_project)
            self.assertEqual(enqueue_call.kwargs["queue"], "pms_costings_queue")
            self.assertTrue(enqueue_call.kwargs["enqueue_after_commit"])
            self.assertEqual(enqueue_call.kwargs["tasks"], ["TASK-1"])
            self.assertEqual(enqueue_call.kwargs["projects"], ["PROJ-1"])
            self.assertNotIn("deduplicate", enqueue_call.kwargs)
            self.assertNotIn("job_id", enqueue_call.kwargs)

    def test_costing_queue_falls_back_to_long(self):
        """Use the long queue when the dedicated costing queue is not configured."""
        with patch("frappe.utils.background_jobs.get_queue_list", return_value=["default", "short", "long"]):
            self.assertEqual(project_costing.get_costing_queue(), "long")

    def test_configured_costing_queue_is_used(self):
        """Isolate costing work onto the dedicated queue when it exists."""
        with patch(
            "frappe.utils.background_jobs.get_queue_list",
            return_value=["default", "short", "long", "pms_costings_queue"],
        ):
            self.assertEqual(project_costing.get_costing_queue(), "pms_costings_queue")


class TestAffectedCostingRecords(IntegrationTestCase):
    def test_affected_names_are_deduplicated_in_first_seen_order(self):
        """Process each affected task and project once, in first-seen order."""
        time_logs = [
            frappe._dict(task="TASK-1", project="PROJ-1"),
            frappe._dict(task="TASK-1", project="PROJ-1"),
            frappe._dict(task="TASK-2", project="PROJ-1"),
            frappe._dict(task=None, project=None),
            frappe._dict(task="TASK-2", project="PROJ-2"),
        ]

        tasks, projects = project_costing.get_affected_tasks_and_projects(time_logs)

        self.assertEqual(tasks, ["TASK-1", "TASK-2"])
        self.assertEqual(projects, ["PROJ-1", "PROJ-2"])

    def test_timesheet_update_queues_previous_and_current_names(self):
        """Changing or removing a row must also refresh its old task and project."""
        timesheet = MagicMock()
        timesheet.flags = frappe._dict()
        timesheet.time_logs = [
            frappe._dict(task="TASK-NEW", project="PROJ-NEW"),
            frappe._dict(task="TASK-SAME", project="PROJ-SAME"),
        ]
        timesheet.get_doc_before_save.return_value = frappe._dict(
            time_logs=[
                frappe._dict(task="TASK-OLD", project="PROJ-OLD"),
                frappe._dict(task="TASK-SAME", project="PROJ-SAME"),
            ]
        )

        with patch("next_pms.project_currency.overrides.timesheet.enqueue_update_task_and_project") as enqueue:
            TimesheetOverwrite.update_task_and_project(timesheet)

        enqueue.assert_called_once_with(
            tasks=["TASK-NEW", "TASK-SAME", "TASK-OLD"],
            projects=["PROJ-NEW", "PROJ-SAME", "PROJ-OLD"],
        )
        self.assertTrue(timesheet.flags.costing_calculation_queued)

    def test_new_timesheet_queues_current_names(self):
        """A first save has no prior rows, so only current task and project names need refresh."""
        timesheet = MagicMock()
        timesheet.flags = frappe._dict()
        timesheet.time_logs = [frappe._dict(task="TASK-1", project="PROJ-1")]
        timesheet.get_doc_before_save.return_value = None

        with patch("next_pms.project_currency.overrides.timesheet.enqueue_update_task_and_project") as enqueue:
            TimesheetOverwrite.update_task_and_project(timesheet)

        enqueue.assert_called_once_with(tasks=["TASK-1"], projects=["PROJ-1"])

    def test_one_timesheet_lifecycle_queues_costing_only_once(self):
        """Multiple hooks in one save must not enqueue duplicate costing jobs."""
        timesheet = MagicMock()
        timesheet.flags = frappe._dict()
        timesheet.time_logs = [frappe._dict(task="TASK-1", project="PROJ-1")]
        timesheet.get_doc_before_save.return_value = None

        with patch("next_pms.project_currency.overrides.timesheet.enqueue_update_task_and_project") as enqueue:
            TimesheetOverwrite.update_task_and_project(timesheet)
            TimesheetOverwrite.update_task_and_project(timesheet)

        enqueue.assert_called_once()


class TestCostingWorkerDataValidity(IntegrationTestCase):
    def test_task_status_is_derived_from_all_remaining_logs(self):
        """Task completion is decided from every remaining timesheet row, not a single flag."""
        cases = [
            ([1, 1], "Completed"),
            ([1, 0], "Working"),
            ([0], "Working"),
            ([], None),
        ]

        for completed_flags, expected_status in cases:
            with self.subTest(completed_flags=completed_flags):
                with patch.object(project_costing.frappe, "get_all", return_value=completed_flags) as get_all:
                    status = project_costing.get_task_status_from_remaining_logs("TASK-1")

                self.assertEqual(status, expected_status)
                get_all.assert_called_once_with(
                    "Timesheet Detail",
                    filters={"task": "TASK-1", "docstatus": ["!=", 2]},
                    pluck="completed",
                )

    def test_worker_passes_derived_statuses_to_tasks_before_projects(self):
        """Update tasks with derived statuses before project rollup so project state stays consistent."""
        with (
            patch.object(
                project_costing,
                "get_task_status_from_remaining_logs",
                side_effect=["Working", "Completed"],
            ) as get_status,
            patch.object(project_costing, "update_tasks") as update_tasks,
            patch.object(project_costing, "update_projects") as update_projects,
        ):
            project_costing.update_task_and_project(
                tasks=["TASK-1", "TASK-2"],
                projects=["PROJ-1"],
            )

        self.assertEqual(get_status.call_args_list, [call("TASK-1"), call("TASK-2")])
        update_tasks.assert_called_once_with(
            ["TASK-1", "TASK-2"],
            {"TASK-1": "Working", "TASK-2": "Completed"},
        )
        update_projects.assert_called_once_with(["PROJ-1"])

    def test_worker_accepts_empty_job_arguments(self):
        """Jobs queued with missing task or project lists must still complete without errors."""
        with (
            patch.object(project_costing, "update_tasks") as update_tasks,
            patch.object(project_costing, "update_projects") as update_projects,
        ):
            project_costing.update_task_and_project(tasks=None, projects=None)

        update_tasks.assert_called_once_with([], {})
        update_projects.assert_called_once_with([])

    def test_update_tasks_skips_deleted_tasks_and_saves_existing_tasks(self):
        """A deleted task in the job payload must not abort updates for remaining tasks."""
        existing_task = MagicMock()

        with (
            patch.object(
                project_costing.frappe.db,
                "exists",
                side_effect=lambda doctype, name: name == "TASK-EXISTS",
            ),
            patch.object(project_costing.frappe, "get_doc", return_value=existing_task) as get_doc,
        ):
            project_costing.update_tasks(
                ["TASK-DELETED", "TASK-EXISTS"],
                {"TASK-DELETED": "Completed", "TASK-EXISTS": "Working"},
            )

        get_doc.assert_called_once_with("Task", "TASK-EXISTS")
        self.assertEqual(existing_task.status, "Working")
        existing_task.save.assert_called_once_with(ignore_permissions=True)

    def test_update_task_without_derived_status_keeps_its_status(self):
        """When remaining logs do not imply a status, keep the task's existing status.

        No remaining timesheet rows (all deleted or cancelled) yields None rather
        than Completed or Working. The task is still saved so hours and costing
        roll up to zero, but status is left alone so an Open task is not overwritten.
        """
        existing_task = MagicMock()
        existing_task.status = "Open"

        with (
            patch.object(project_costing.frappe.db, "exists", return_value=True),
            patch.object(project_costing.frappe, "get_doc", return_value=existing_task),
        ):
            project_costing.update_tasks(["TASK-1"], {"TASK-1": None})

        self.assertEqual(existing_task.status, "Open")
        existing_task.save.assert_called_once_with(ignore_permissions=True)

    def test_update_projects_skips_deleted_projects_and_recalculates_existing_projects(self):
        """A deleted project in the job payload must not abort updates for remaining projects.

        Names are captured at enqueue time and the worker runs after commit, so the
        project may already be gone. Skipping it lets any other projects in the
        batch still recalculate hours, costing, and profit.
        """
        existing_project = MagicMock()

        with (
            patch.object(
                project_costing.frappe.db,
                "exists",
                side_effect=lambda doctype, name: name == "PROJ-EXISTS",
            ),
            patch.object(project_costing.frappe, "get_doc", return_value=existing_project) as get_doc,
        ):
            project_costing.update_projects(["PROJ-DELETED", "PROJ-EXISTS"])

        get_doc.assert_called_once_with("Project", "PROJ-EXISTS")
        existing_project.update_project.assert_called_once_with()
        existing_project.save.assert_called_once_with(ignore_permissions=True)


class TestProjectTimesheetBillingRecalculation(IntegrationTestCase):
    def test_completed_batches_refresh_all_project_tasks_and_project(self):
        """After the last billing batch, recalculate all project tasks and the project once.

        Intermediate batches only rewrite timesheet billing rates and suppress
        per-timesheet costing jobs. When start > 0 and no more timesheets remain,
        the worker refreshes every project task and the project from those final rates.
        """
        with (
            patch.object(
                project_timesheet_billing_recalculation.frappe,
                "get_all",
                side_effect=[[], ["TASK-1", "TASK-2"]],
            ),
            patch.object(
                project_timesheet_billing_recalculation.frappe.db,
                "get_value",
                return_value="Test Project",
            ),
            patch.object(
                project_timesheet_billing_recalculation,
                "update_task_and_project",
            ) as update_task_and_project,
            patch.object(
                project_timesheet_billing_recalculation.frappe,
                "msgprint",
                return_value="completed",
            ),
        ):
            result = project_timesheet_billing_recalculation.recalculate_timesheet_billing(
                project_id="PROJ-1",
                valid_from_date="2026-01-01",
                start=300,
            )

        self.assertEqual(result, "completed")
        update_task_and_project.assert_called_once_with(
            tasks=["TASK-1", "TASK-2"],
            projects=["PROJ-1"],
        )

    def test_batch_revalidates_each_timesheet_before_save(self):
        """validate() must be called explicitly: save() skips it for submitted timesheets.

        For a docstatus 1 document, save() classifies the write as
        update_after_submit and only runs before_update_after_submit, so
        billing/costing rates are recomputed solely through this explicit call.
        """
        timesheet_doc = MagicMock()
        timesheet_doc.flags = frappe._dict()

        with (
            patch.object(
                project_timesheet_billing_recalculation.frappe,
                "get_all",
                return_value=[frappe._dict(name="TS-1")],
            ),
            patch.object(
                project_timesheet_billing_recalculation.frappe,
                "get_doc",
                return_value=timesheet_doc,
            ),
            patch.object(project_timesheet_billing_recalculation.frappe, "enqueue"),
        ):
            project_timesheet_billing_recalculation.recalculate_timesheet_billing(
                project_id="PROJ-1",
                valid_from_date="2026-01-01",
            )

        timesheet_doc.validate.assert_called_once_with()
        timesheet_doc.save.assert_called_once_with(ignore_permissions=True)

    def test_no_initial_timesheets_does_not_recalculate_costing(self):
        """Skip costing recalculation when the project has no timesheets to roll up."""
        with (
            patch.object(project_timesheet_billing_recalculation.frappe, "get_all", return_value=[]),
            patch.object(
                project_timesheet_billing_recalculation.frappe.db,
                "get_value",
                return_value="Test Project",
            ),
            patch.object(
                project_timesheet_billing_recalculation,
                "update_task_and_project",
            ) as update_task_and_project,
            patch.object(
                project_timesheet_billing_recalculation.frappe,
                "msgprint",
                return_value="not found",
            ),
        ):
            result = project_timesheet_billing_recalculation.recalculate_timesheet_billing(
                project_id="PROJ-1",
                valid_from_date="2026-01-01",
            )

        self.assertEqual(result, "not found")
        update_task_and_project.assert_not_called()

    def test_batch_saves_timesheets_without_per_timesheet_costing_jobs(self):
        """Batch billing recalculation must not enqueue a costing job for every timesheet save.

        Setting costing_calculation_queued before save suppresses the per-timesheet
        worker. Rollup is deferred to the final empty batch so hundreds of timesheets
        do not each queue their own task and project recalculation.
        """
        timesheet_doc = MagicMock()
        timesheet_doc.flags = frappe._dict()

        with (
            patch.object(
                project_timesheet_billing_recalculation.frappe,
                "get_all",
                return_value=[frappe._dict(name="TS-1")],
            ),
            patch.object(
                project_timesheet_billing_recalculation.frappe,
                "get_doc",
                return_value=timesheet_doc,
            ),
            patch.object(project_timesheet_billing_recalculation.frappe, "enqueue") as enqueue,
        ):
            project_timesheet_billing_recalculation.recalculate_timesheet_billing(
                project_id="PROJ-1",
                valid_from_date="2026-01-01",
            )

        self.assertTrue(timesheet_doc.flags.ignore_validate_update_after_submit)
        self.assertTrue(timesheet_doc.flags.costing_calculation_queued)
        self.assertTrue(timesheet_doc.ignore_backdated_validation)
        timesheet_doc.save.assert_called_once_with(ignore_permissions=True)
        enqueue.assert_called_once_with(
            project_timesheet_billing_recalculation.recalculate_timesheet_billing,
            job_name="recalculate_timesheet_billing_PROJ-1",
            queue="long",
            timeout=3600,
            project_id="PROJ-1",
            valid_from_date="2026-01-01",
            start=300,
        )


class TestCostingWorkerBusinessValues(IntegrationTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.employee = make_employee("next-employee@example.com")

    def make_project(self, **overrides):
        project = frappe.get_doc(
            {
                "doctype": "Project",
                "project_name": f"Costing Worker {frappe.generate_hash(length=8)}",
                "company": "Facebook",
                "customer": "Meta",
                "custom_billing_type": "Non-Billable",
                **overrides,
            }
        )
        project.insert(ignore_permissions=True)
        return project

    def make_task(self, project):
        return frappe.get_doc(
            {
                "doctype": "Task",
                "subject": f"Costing Worker Task {frappe.generate_hash(length=8)}",
                "project": project,
            }
        ).insert(ignore_permissions=True)

    def make_timesheet(self, project, task, date, hours, is_billable=0, completed=0):
        timesheet = frappe.get_doc(
            {
                "doctype": "Timesheet",
                "employee": self.employee,
                "parent_project": project,
                "time_logs": [
                    {
                        "task": task,
                        "project": project,
                        "hours": hours,
                        "is_billable": is_billable,
                        "completed": completed,
                        "from_time": f"{date} 00:00:00",
                        "to_time": f"{date} 00:00:00",
                        "description": "Costing worker value test",
                    }
                ],
            }
        )
        timesheet.ignore_backdated_validation = True
        with patch.object(project_costing.frappe, "enqueue"):
            timesheet.insert(ignore_permissions=True)
        return timesheet

    def delete_timesheet(self, name):
        with patch.object(project_costing.frappe, "enqueue"):
            frappe.delete_doc("Timesheet", name, force=1)

    def run_worker(self, tasks, projects):
        project_costing.update_task_and_project(tasks=tasks, projects=projects)

    def test_task_rollup_matches_timesheet_rows(self):
        """Worker-persisted hours, costing, dates, and status must match the remaining timesheet rows."""
        project = self.make_project()
        task = self.make_task(project.name)
        day_one, day_two = add_days(nowdate(), -1), nowdate()
        first = self.make_timesheet(project.name, task.name, day_one, hours=2)
        second = self.make_timesheet(project.name, task.name, day_two, hours=3)

        self.run_worker([task.name], [project.name])

        expected_costing = flt(first.time_logs[0].costing_amount) + flt(second.time_logs[0].costing_amount)
        self.assertGreater(expected_costing, 0)

        task_doc = frappe.get_doc("Task", task.name)
        self.assertEqual(flt(task_doc.actual_time), 5.0)
        self.assertAlmostEqual(flt(task_doc.total_costing_amount), expected_costing, places=2)
        self.assertFalse(flt(task_doc.total_billing_amount))
        self.assertEqual(getdate(task_doc.act_start_date), getdate(day_one))
        self.assertEqual(getdate(task_doc.act_end_date), getdate(day_two))
        self.assertEqual(task_doc.status, "Working")

    def test_task_completed_status_requires_every_remaining_row_done(self):
        """A task stays Working until every remaining timesheet row is marked completed."""
        project = self.make_project()
        task = self.make_task(project.name)
        self.make_timesheet(project.name, task.name, add_days(nowdate(), -1), hours=2, completed=1)
        pending = self.make_timesheet(project.name, task.name, nowdate(), hours=3, completed=0)

        self.run_worker([task.name], [project.name])
        self.assertEqual(frappe.db.get_value("Task", task.name, "status"), "Working")

        frappe.db.set_value("Timesheet Detail", pending.time_logs[0].name, "completed", 1)
        self.run_worker([task.name], [project.name])
        self.assertEqual(frappe.db.get_value("Task", task.name, "status"), "Completed")

    def test_deleted_timesheets_leave_rollup_of_remaining_rows(self):
        """Deleted timesheets must drop out of the rollup instead of leaving stale totals."""
        project = self.make_project()
        task = self.make_task(project.name)
        first = self.make_timesheet(project.name, task.name, add_days(nowdate(), -1), hours=2)
        second = self.make_timesheet(project.name, task.name, nowdate(), hours=3)

        self.delete_timesheet(second.name)
        self.run_worker([task.name], [project.name])
        self.assertEqual(flt(frappe.db.get_value("Task", task.name, "actual_time")), 2.0)

        self.delete_timesheet(first.name)
        self.run_worker([task.name], [project.name])

        task_doc = frappe.get_doc("Task", task.name)
        self.assertFalse(flt(task_doc.actual_time))
        self.assertFalse(flt(task_doc.total_costing_amount))
        self.assertEqual(task_doc.status, "Working")

    def test_project_rollup_and_estimated_profit(self):
        """Project hours, costing, dates, and estimated profit must be recomputed from remaining timesheets."""
        project = self.make_project(estimated_costing=50000)
        task = self.make_task(project.name)
        day_one, day_two = add_days(nowdate(), -1), nowdate()
        first = self.make_timesheet(project.name, task.name, day_one, hours=2)
        second = self.make_timesheet(project.name, task.name, day_two, hours=3)

        self.run_worker([task.name], [project.name])

        expected_costing = flt(first.time_logs[0].costing_amount) + flt(second.time_logs[0].costing_amount)
        expected_profit = 50000 - expected_costing

        project_doc = frappe.get_doc("Project", project.name)
        self.assertEqual(flt(project_doc.actual_time), 5.0)
        self.assertAlmostEqual(flt(project_doc.total_costing_amount), expected_costing, places=2)
        self.assertEqual(getdate(project_doc.actual_start_date), getdate(day_one))
        self.assertEqual(getdate(project_doc.actual_end_date), getdate(day_two))
        self.assertAlmostEqual(flt(project_doc.custom_estimated_profit), expected_profit, places=2)
        self.assertAlmostEqual(
            flt(project_doc.custom_percentage_estimated_profit),
            expected_profit * 100 / 50000,
            places=2,
        )

    def test_time_and_material_billing_rollup(self):
        """Time-and-material billing amounts must roll up to both the task and the project."""
        project = self.make_project(
            custom_billing_type="Time and Material",
            custom_default_hourly_billing_rate=100,
        )
        task = self.make_task(project.name)
        first = self.make_timesheet(project.name, task.name, add_days(nowdate(), -1), hours=2, is_billable=1)
        self.make_timesheet(project.name, task.name, nowdate(), hours=3, is_billable=1)

        self.assertEqual(flt(first.time_logs[0].billing_rate), 100.0)
        self.assertEqual(flt(first.time_logs[0].billing_amount), 200.0)

        self.run_worker([task.name], [project.name])

        self.assertAlmostEqual(flt(frappe.db.get_value("Task", task.name, "total_billing_amount")), 500.0, places=2)
        self.assertAlmostEqual(
            flt(frappe.db.get_value("Project", project.name, "total_billable_amount")), 500.0, places=2
        )

    def test_retainer_budget_hours_consumed_in_fifo_order(self):
        """Retainer hours must consume budget rows first-in-first-out."""
        budget_start, budget_end = add_days(nowdate(), -30), nowdate()
        project = self.make_project(
            custom_billing_type="Retainer",
            custom_default_hourly_billing_rate=100,
            custom_project_budget_hours=[
                {"start_date": budget_start, "end_date": budget_end, "hours_purchased": 3},
                {"start_date": budget_start, "end_date": budget_end, "hours_purchased": 4},
            ],
        )
        task = self.make_task(project.name)
        self.make_timesheet(project.name, task.name, add_days(nowdate(), -1), hours=2, is_billable=1)
        self.make_timesheet(project.name, task.name, nowdate(), hours=3, is_billable=1)

        self.run_worker([task.name], [project.name])

        project_doc = frappe.get_doc("Project", project.name)
        first_budget, second_budget = project_doc.custom_project_budget_hours
        self.assertEqual(flt(first_budget.consumed_hours), 3.0)
        self.assertEqual(flt(first_budget.remaining_hours), 0.0)
        self.assertEqual(flt(second_budget.consumed_hours), 2.0)
        self.assertEqual(flt(second_budget.remaining_hours), 2.0)
        self.assertEqual(flt(project_doc.custom_total_hours_purchased), 7.0)
        self.assertEqual(flt(project_doc.custom_total_hours_remaining), 2.0)

    def test_moving_row_to_another_task_moves_rollup(self):
        """Hours must leave the old task and land on the new one when a row is reassigned."""
        project = self.make_project()
        task_a = self.make_task(project.name)
        task_b = self.make_task(project.name)
        timesheet = self.make_timesheet(project.name, task_a.name, nowdate(), hours=2)

        self.run_worker([task_a.name], [project.name])
        self.assertEqual(flt(frappe.db.get_value("Task", task_a.name, "actual_time")), 2.0)

        timesheet.reload()
        timesheet.ignore_backdated_validation = True
        timesheet.time_logs[0].task = task_b.name
        with patch.object(project_costing.frappe, "enqueue"):
            timesheet.save(ignore_permissions=True)

        self.run_worker([task_a.name, task_b.name], [project.name])
        self.assertFalse(flt(frappe.db.get_value("Task", task_a.name, "actual_time")))
        self.assertEqual(flt(frappe.db.get_value("Task", task_b.name, "actual_time")), 2.0)
