import frappe
from frappe.model.document import Document

from next_pms.tasks.employee_salary import calculate_salary_values

# Employee fields the salary breakdown is calculated from
SALARY_INPUTS = ("ctc", "salary_currency", "custom_working_hours", "custom_work_schedule")


def before_save(doc: Document, method: str | None = None) -> None:
    """Recalculate the stored salary breakdown when the CTC, salary currency or working hours change.

    Runs after Document.validate_higher_perm_levels, so the values set here are kept.
    """
    if not doc.is_new() and not any(doc.has_value_changed(fieldname) for fieldname in SALARY_INPUTS):
        return

    row = frappe._dict(name=doc.name, **{fieldname: doc.get(fieldname) for fieldname in SALARY_INPUTS})
    doc.update(calculate_salary_values([row])[doc.name])
