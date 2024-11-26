import frappe
from frappe.query_builder.functions import Sum


def get_allocation_list_for_employee_for_given_range(columns: list, value_key: str, values: list, start_date, end_date):
    """
    Returns a list of resource allocations for the given list for given key, within the given date range.

    Args:
        list_keys (str): The key in the resource allocation table that corresponds to the employee list.
        list (list): The employee list.
        start_date (str): The start date for the allocation range.
        end_date (str): The end date for the allocation range.

    Returns:
        list: A list of resource allocation dictionaries.
    """

    if not values:
        return []

    # Only ways was to write sql for this, normal frappe methods are not working, also try with query build but looks like it dont have support of nesting condition.
    # nosemgrep
    return frappe.db.sql(
        f"""
        SELECT { ', '.join(columns)} FROM `tabResource Allocation`
            WHERE {"employee" if value_key == "employee" else "project"} IN %(names)s
            AND (
                (allocation_start_date <= %(start_date)s AND allocation_end_date >= %(start_date)s)
                OR (allocation_start_date >= %(start_date)s AND allocation_end_date <= %(end_date)s)
                OR (allocation_start_date <= %(end_date)s AND allocation_end_date >= %(end_date)s)
                OR (allocation_start_date <= %(start_date)s AND allocation_end_date >= %(end_date)s)
            )
            ORDER BY allocation_start_date, allocation_end_date;
    """,
        {"list_key": value_key, "names": values, "start_date": start_date, "end_date": end_date},
        as_dict=True,
    )  # nosemgrep


def get_allocation_worked_hours_for_given_projects(project: str, start_date: str, end_date: str):
    """Get the total hours spend for given projects for given time range.

    Args:
        project (str): project name
        start_date (str): start date
        end_date (str): end date

    Returns:
        flot: total hours spend for given project
    """
    TimesheetDetail = frappe.qb.DocType("Timesheet Detail")

    total_hours = (
        frappe.qb.from_(TimesheetDetail)
        .select(
            Sum(TimesheetDetail.hours).as_("time"),
        )
        .where(TimesheetDetail.project == project)
        .where((TimesheetDetail.docstatus == 1) | (TimesheetDetail.docstatus == 0))
        .where((TimesheetDetail.from_time >= start_date) & (TimesheetDetail.to_time <= end_date))
    ).run(as_dict=True)[0]

    return total_hours.get("time") or 0.0


def get_allocation_worked_hours_for_given_employee(project: str, employee: str, start_date: str, end_date: str):
    """Get the total hours spend for given projects for given time range.

    Args:
        project (str): project name
        start_date (str): start date
        end_date (str): end date

    Returns:
        flot: total hours spend for given project
    """
    Timesheet = frappe.qb.DocType("Timesheet")

    all_timesheets = (
        frappe.qb.from_(Timesheet)
        .select(Timesheet.name)
        .where(Timesheet.employee == employee)
        .where(Timesheet.parent_project == project)
        .where((Timesheet.docstatus == 1) | (Timesheet.docstatus == 0))
        .where((Timesheet.start_date >= start_date) & (Timesheet.end_date <= end_date))
    ).run(as_dict=True)

    if not all_timesheets:
        return 0.0

    timesheets = [timesheet["name"] for timesheet in all_timesheets]

    TimesheetDetail = frappe.qb.DocType("Timesheet Detail")

    total_hours = (
        frappe.qb.from_(TimesheetDetail)
        .select(
            Sum(TimesheetDetail.hours).as_("time"),
        )
        .where(TimesheetDetail.parent.isin(timesheets))
        .where((TimesheetDetail.docstatus == 1) | (TimesheetDetail.docstatus == 0))
        .where((TimesheetDetail.from_time >= start_date) & (TimesheetDetail.to_time <= end_date))
    ).run(as_dict=True)[0]

    return total_hours.get("time") or 0.0
