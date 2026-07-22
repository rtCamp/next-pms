import frappe
from frappe.utils import flt, today


def execute():
    """Re-sync currency and cost for Resource Allocations that have not ended yet.

    Currency is pulled from the linked project, then hourly_cost_rate is re-derived
    from the employee's CTC in that currency and multiplied by total_allocated_hours.

    Unlike populate_resource_allocation_cost, this writes `currency` itself instead of
    skipping rows where it is blank — a blank currency is what left those rows at 0.
    """
    allocations = frappe.get_all(
        "Resource Allocation",
        filters={"allocation_end_date": [">=", today()]},
        fields=["name", "employee", "project", "currency", "total_allocated_hours"],
    )
    if not allocations:
        return

    project_currency = get_project_currency({allocation.project for allocation in allocations if allocation.project})
    default_currency = frappe.defaults.get_global_default("currency")
    hourly_rates = {}
    updated = no_currency = no_rate = 0

    for allocation in allocations:
        currency = project_currency.get(allocation.project) or allocation.currency or default_currency
        if not currency:
            no_currency += 1
            continue

        key = (allocation.employee, currency)
        if key not in hourly_rates:
            hourly_rates[key] = get_hourly_cost_rate(allocation.employee, currency)
        hourly_cost_rate = hourly_rates[key]

        values = {"currency": currency}
        if hourly_cost_rate is None:
            no_rate += 1
        else:
            values["hourly_cost_rate"] = hourly_cost_rate
            values["total_cost"] = hourly_cost_rate * flt(allocation.total_allocated_hours)

        frappe.db.set_value("Resource Allocation", allocation.name, values, update_modified=False)
        updated += 1

    frappe.db.commit()
    print(
        f"Resource Allocation: {updated} of {len(allocations)} updated, "
        f"{no_rate} without a derivable cost rate, {no_currency} without a currency"
    )


def get_project_currency(projects: set) -> dict:
    if not projects:
        return {}

    return dict(
        frappe.get_all(
            "Project",
            filters={"name": ["in", list(projects)]},
            fields=["name", "custom_currency"],
            as_list=True,
        )
    )


def get_hourly_cost_rate(employee: str, currency: str) -> float | None:
    """Hourly cost of the employee in `currency`, or None when it cannot be derived."""
    from next_pms.utils.employee import get_employee_salary

    ctc, salary_currency = frappe.get_cached_value("Employee", employee, ["ctc", "salary_currency"])
    if not ctc or not salary_currency:
        return None

    try:
        salary_info = get_employee_salary(
            employee=employee,
            to_currency=currency,
            date=today(),
            throw=False,
            ctc=ctc,
            salary_currency=salary_currency,
        )
    except Exception as e:
        frappe.log_error(
            message=f"Failed to derive hourly cost for {employee} in {currency}: {e!s}",
            title="Resource Allocation Cost Patch",
        )
        return None

    return flt(salary_info.get("hourly_salary", 0)) if salary_info else 0
