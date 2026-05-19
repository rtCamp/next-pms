import frappe
from frappe.utils import flt, today


def execute():
    """Backfill hourly_cost_rate and total_cost for existing Resource Allocations."""
    from next_pms.utils.employee import get_employee_salary

    allocations = frappe.get_all(
        "Resource Allocation",
        filters={"hourly_cost_rate": ["in", [None, 0]]},
        fields=["name", "employee", "currency", "total_allocated_hours"],
    )

    for alloc in allocations:
        if not alloc.currency:
            continue

        try:
            salary_info = get_employee_salary(
                employee=alloc.employee,
                to_currency=alloc.currency,
                date=today(),
                throw=False,
            )

            if not salary_info:
                continue

            hourly_cost_rate = flt(salary_info.get("hourly_salary", 0))
            total_cost = hourly_cost_rate * flt(alloc.total_allocated_hours)

            frappe.db.set_value(
                "Resource Allocation",
                alloc.name,
                {
                    "hourly_cost_rate": hourly_cost_rate,
                    "total_cost": total_cost,
                },
                update_modified=False,
            )
        except Exception as e:
            frappe.log_error(
                message=f"Failed to calculate cost for {alloc.name}: {e!s}",
                title="Resource Allocation Cost Patch",
            )

    frappe.db.commit()
