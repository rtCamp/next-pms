import frappe

from next_pms.resource_management.api.utils.helpers import (
    filter_project_list,
    get_dates_date,
    handle_customer,
)
from next_pms.resource_management.api.utils.query import (
    get_allocation_list_for_employee_for_given_range,
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
    page_length=10,
    start=0,
):
    frappe.only_for(["Timesheet Manager", "Timesheet User", "Projects Manager"], message=True)

    data = []
    customer = {}
    weeks = get_dates_date(max_week, date)
    res = {"dates": weeks}

    projects, total_count = filter_project_list(
        project_name,
        page_length=page_length,
        start=start,
    )

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
    )

    resource_allocation_map = {}
    for resource_allocation in resource_allocation_data:
        if resource_allocation.project not in resource_allocation_map:
            resource_allocation_map[resource_allocation.project] = []
        resource_allocation_map[resource_allocation.project].append(resource_allocation)

    for project in projects:
        all_week_data, all_dates_data = [], []
        project_resource_allocation = resource_allocation_map.get(project.name, [])

        for week in weeks:
            total_allocated_hours_for_given_week = 0

            for date in week.get("dates"):
                total_allocated_hours_for_given_date = 0
                project_resource_allocation_for_given_date = []

                for resource_allocation in project_resource_allocation:
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

    return res
