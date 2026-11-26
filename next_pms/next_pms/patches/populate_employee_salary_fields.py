from frappe.utils.fixtures import sync_fixtures

from next_pms.tasks.employee_salary import update_employee_salaries


def execute() -> None:
    """Fill the Employee salary breakdown fields, which are now stored, without waiting for the daily job."""
    # bench migrate syncs fixtures after post_model_sync patches; sync them first so the columns exist
    sync_fixtures("next_pms")
    update_employee_salaries()
