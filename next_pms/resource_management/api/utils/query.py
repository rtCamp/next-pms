import frappe


def get_allocation_list_for_employee_for_given_range(columns: list, value_key: str, values: list, start_date, end_date):
    """
    Returns a list of resource allocations for the given list for given key, within the given date range.

    Args:
        %(list_key)s (str): The key in the resource allocation table that corresponds to the employee list.
        list (list): The employee list.
        %(start_date)s (str): The start date for the allocation range.
        %(end_date)s (str): The end date for the allocation range.

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
