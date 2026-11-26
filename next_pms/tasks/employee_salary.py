"""Keep the salary breakdown fields on Employee up to date.

The fields are read only and stored, so a daily job recalculates them from the CTC, the working
hours, the day's exchange rates and the latest Salary Structure Assignment.
"""

import frappe
from frappe.utils import create_batch, flt

from next_pms.utils.employee import get_income_tax_slabs, get_salary_breakdown

BATCH_SIZE = 100
CONVERSION_CURRENCIES = ("USD", "INR")
CURRENCY_FIELDS = {"custom_usd_currency": "USD", "custom_inr_currency": "INR"}
AMOUNT_FIELDS = (
    "custom_monthly_salary",
    "custom_hourly_salary",
    "custom_annual_salary_usd",
    "custom_monthly_salary_usd",
    "custom_hourly_salary_usd",
    "custom_annual_salary_inr",
    "custom_monthly_salary_inr",
    "custom_hourly_salary_inr",
)
SALARY_FIELDS = (*AMOUNT_FIELDS, "custom_income_tax_slab", *CURRENCY_FIELDS)


def update_employee_salaries() -> None:
    """Scheduler entry point (daily_long): recalculate the salary breakdown of active employees, a batch at a time."""
    employees = frappe.get_all("Employee", filters={"status": "Active"}, pluck="name", order_by="name")
    for batch in create_batch(employees, BATCH_SIZE):
        update_salary_fields(batch)
        # Release the batch's Employee row locks before the next batch's exchange rate lookups
        frappe.db.commit()  # nosemgrep: frappe-manual-commit — deliberate per-batch commit in a long scheduler job


def update_salary_fields(employees: list[str]) -> None:
    """Recalculate the salary breakdown fields of the given employees, and save the ones that changed.

    Saved without changing `modified`, so the job doesn't make open Employee forms stale.

    Args:
        employees (list[str]): Employee IDs.
    """
    Employee = frappe.qb.DocType("Employee")
    rows = (
        frappe.qb.from_(Employee)
        .select(
            Employee.name,
            Employee.ctc,
            Employee.salary_currency,
            Employee.custom_working_hours,
            Employee.custom_work_schedule,
            *(Employee[fieldname] for fieldname in SALARY_FIELDS),
        )
        .where(Employee.name.isin(employees))
        .run(as_dict=True)
    )

    salaried = [row for row in rows if row.ctc and row.salary_currency]
    # None is each employee's own salary currency
    breakdowns = {currency: get_salary_breakdown(salaried, currency) for currency in (None, *CONVERSION_CURRENCIES)}
    tax_slabs = get_income_tax_slabs([row.name for row in salaried])

    updates = {}
    for row in rows:
        values = get_salary_values(row, breakdowns, tax_slabs)
        if any(is_changed(row[fieldname], value) for fieldname, value in values.items()):
            updates[row.name] = values

    frappe.db.bulk_update("Employee", updates, chunk_size=BATCH_SIZE, update_modified=False)


def get_salary_values(row: dict, breakdowns: dict[str | None, dict], tax_slabs: dict[str, str | None]) -> dict:
    """Return the salary breakdown field values of an Employee row; amounts are 0 without a CTC and salary currency."""
    values = {fieldname: 0.0 for fieldname in AMOUNT_FIELDS}
    values["custom_income_tax_slab"] = None
    values.update(CURRENCY_FIELDS)

    own = breakdowns[None].get(row.name)
    if not own:
        return values

    values["custom_monthly_salary"] = round_amount("custom_monthly_salary", own["monthly_salary"], row.salary_currency)
    values["custom_hourly_salary"] = round_amount("custom_hourly_salary", own["hourly_salary"], row.salary_currency)
    values["custom_income_tax_slab"] = tax_slabs.get(row.name)
    for currency in CONVERSION_CURRENCIES:
        converted = breakdowns[currency][row.name]
        suffix = currency.lower()
        for fieldname, amount in (
            (f"custom_annual_salary_{suffix}", converted["monthly_salary"] * 12),
            (f"custom_monthly_salary_{suffix}", converted["monthly_salary"]),
            (f"custom_hourly_salary_{suffix}", converted["hourly_salary"]),
        ):
            values[fieldname] = round_amount(fieldname, amount, currency)
    return values


def round_amount(fieldname: str, amount: float, currency: str) -> float:
    """Round an amount to the field's precision for the currency, as the form shows it."""
    return flt(amount, frappe.get_precision("Employee", fieldname, currency=currency))


def is_changed(old: object, new: object) -> bool:
    """Whether a stored value differs from its recalculated one."""
    if isinstance(new, float):
        return flt(old) != new
    return old != new
