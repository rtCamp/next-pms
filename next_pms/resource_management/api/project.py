import frappe
from frappe.automation.doctype.auto_repeat.auto_repeat import getdate
from frappe.email.doctype.auto_email_report.auto_email_report import DATE_FORMAT
from frappe.utils import add_days

from next_pms.resource_management.api.utils.helpers import (
    filter_project_list,
    get_dates_date,
    handle_customer,
    resource_api_permissions_check,
)
from next_pms.resource_management.api.utils.query import (
    get_allocation_list_for_employee_for_given_range,
    get_allocation_worked_hours_for_given_employee,
    get_allocation_worked_hours_for_given_projects,
)


@frappe.whitelist()
def get_resource_management_project_view_data(
    date: str,
    max_week: int = 2,
    project_name=None,
    business_unit=None,
    project_manager=None,
    project_type=None,
    customer=None,
    is_billable=-1,
    page_length=10,
    start=0,
):
    permissions = resource_api_permissions_check()

    projects, total_count = filter_project_list(
        project_name,
        page_length=page_length,
        start=start,
        customer=customer,
    )

    data = []
    customer = {}
    weeks = get_dates_date(max_week, date)
    res = {"dates": weeks}

    resource_allocation_data = get_allocation_list_for_employee_for_given_range(
        [
            "name",
            "employee",
            "allocation_start_date",
            "allocation_end_date",
            "hours_allocated_per_day",
            "project",
            "project_name",
            "customer",
            "is_billable",
        ],
        "project",
        [project.name for project in projects],
        weeks[0].get("start_date"),
        weeks[-1].get("end_date"),
        is_billable,
    )

    resource_allocation_map = {}
    for resource_allocation in resource_allocation_data:
        if resource_allocation.project not in resource_allocation_map:
            resource_allocation_map[resource_allocation.project] = {}
        resource_allocation_map[resource_allocation.project][resource_allocation.name] = resource_allocation

    for project in projects:
        all_week_data, all_dates_data = [], []
        project_resource_allocation = resource_allocation_map.get(project.name, [])
        week_index = 0

        for week in weeks:
            total_allocated_hours_for_given_week = 0

            for date in week.get("dates"):
                total_allocated_hours_for_given_date = 0
                project_resource_allocation_for_given_date = []

                for resource_allocation_name in project_resource_allocation:
                    resource_allocation = project_resource_allocation[resource_allocation_name]
                    customer = handle_customer(customer, resource_allocation.customer)

                    if resource_allocation.allocation_start_date <= date <= resource_allocation.allocation_end_date:
                        total_allocated_hours_for_given_date += resource_allocation.hours_allocated_per_day
                        project_resource_allocation_for_given_date.append(
                            {
                                "name": resource_allocation.name,
                                "date": date,
                            }
                        )

                all_dates_data.append(
                    {
                        "date": date,
                        "total_allocated_hours": total_allocated_hours_for_given_date,
                        "project_resource_allocation_for_given_date": project_resource_allocation_for_given_date,
                        "total_worked_hours": get_allocation_worked_hours_for_given_projects(project.name, date, date),
                        "week_index": week_index,
                    }
                )

                total_allocated_hours_for_given_week += total_allocated_hours_for_given_date

            all_week_data.append(
                {
                    "total_allocated_hours": total_allocated_hours_for_given_week,
                    "total_worked_hours": get_allocation_worked_hours_for_given_projects(
                        project.name, week.get("start_date"), week.get("end_date")
                    ),
                }
            )
            week_index += 1
        data.append(
            {
                **project,
                "all_week_data": all_week_data,
                "all_dates_data": all_dates_data,
                "project_allocations": project_resource_allocation,
            }
        )

    res["data"] = data
    res["customer"] = customer
    res["total_count"] = total_count
    res["has_more"] = int(start) + int(page_length) < total_count
    res["permissions"] = permissions

    return res


@frappe.whitelist()
def get_employees_resrouce_data_for_given_project(
    project: str, start_date: str, end_date: str, is_billable: str, reports_to=None
):
    permissions = resource_api_permissions_check()

    resource_allocation_data = get_allocation_list_for_employee_for_given_range(
        [
            "name",
            "employee",
            "allocation_start_date",
            "allocation_end_date",
            "hours_allocated_per_day",
            "project",
            "project_name",
            "customer",
            "is_billable",
        ],
        "project",
        [project],
        start_date,
        end_date,
        is_billable,
    )

    resource_allocation_map = {}
    for resource_allocation in resource_allocation_data:
        if resource_allocation.employee not in resource_allocation_map:
            resource_allocation_map[resource_allocation.employee] = {}
        resource_allocation_map[resource_allocation.employee][resource_allocation.name] = resource_allocation

    res = {}
    data = []
    customer = {}
    start_date = getdate(start_date)
    end_date = getdate(end_date)

    for employee in resource_allocation_map:
        employee_resource_allocation = resource_allocation_map.get(employee, [])

        employee = frappe.db.get_value(
            "Employee", employee, ["employee_name", "name", "image", "reports_to"], as_dict=1
        )

        current_date = start_date

        all_dates_date = []

        while current_date <= end_date:
            if current_date.weekday() in [5, 6]:
                current_date = add_days(current_date, 1)
                continue

            total_allocated_hours_for_employee = 0
            employee_resource_allocation_for_given_date = []

            for resource_allocation_name in employee_resource_allocation:
                resource_allocation = employee_resource_allocation[resource_allocation_name]

                customer = handle_customer(customer, resource_allocation.customer)

                if resource_allocation.allocation_start_date <= current_date <= resource_allocation.allocation_end_date:
                    total_allocated_hours_for_employee += resource_allocation.hours_allocated_per_day
                    employee_resource_allocation_for_given_date.append(
                        {
                            "name": resource_allocation.name,
                            "date": current_date,
                        }
                    )

            total_worked_hours_for_employee = get_allocation_worked_hours_for_given_employee(
                project, employee.name, current_date.strftime(DATE_FORMAT), current_date.strftime(DATE_FORMAT)
            )

            all_dates_date.append(
                {
                    "date": current_date,
                    "total_allocated_hours": total_allocated_hours_for_employee,
                    "total_worked_hours": total_worked_hours_for_employee,
                    "employee_resource_allocation_for_given_date": employee_resource_allocation_for_given_date,
                }
            )

            current_date = add_days(current_date, 1)
        data.append({**employee, "all_dates_date": all_dates_date, "allocations": employee_resource_allocation})

    res["data"] = data
    res["customer"] = customer
    res["permissions"] = permissions

    return res
