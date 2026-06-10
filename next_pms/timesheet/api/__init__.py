import frappe
from frappe import get_all, get_list, get_roles, get_value, whitelist


@whitelist(methods=["GET"])
def get_employee_with_role(role: str | list[str]):
    """returns a list of all approvers for the given role like ["Projects Manager","Projects User"]"""
    ## TODO : Deprecate this method and use get_approver_details instead, as it returns only approver details and does not expose role-based output.
    import json

    if isinstance(role, str):
        role = json.loads(role)

    user_ids = get_all(
        "Has Role",
        filters={"role": ["in", role], "parenttype": "User", "parent": ["!=", "Administrator"]},
        pluck="parent",
    )
    employees = get_all(
        "Employee", filters={"user_id": ["in", user_ids], "status": "Active"}, fields=["name", "employee_name"]
    )
    return employees


@whitelist(methods=["GET"])
def get_approver_details():
    """returns a list of approver details"""
    roles = ["Projects Manager", "Projects User"]

    user_ids = get_all(
        "Has Role",
        filters={"role": ["in", roles], "parenttype": "User", "parent": ["!=", "Administrator"]},
        pluck="parent",
    )
    employees = get_all(
        "Employee", filters={"user_id": ["in", user_ids], "status": "Active"}, fields=["name", "employee_name", "image"]
    )
    return employees


def filter_employees(
    employee_name: str | None = None,
    department: list | str | None = None,
    project: list | str | None = None,
    page_length: int = 10,
    start: int = 0,
    user_group: list | str | None = None,
    status: list | str | None = None,
    ids: list[str] | None = None,
    reports_to: list | str | None = None,
    business_unit: list | str | None = None,
    designation: list | str | None = None,
    roles: list[str] | None = None,
    ignore_default_filters: bool = False,
    ignore_permissions: bool = False,
    extra_fields: list[str] | None = None,
) -> tuple[list, int]:
    """Apply Employee-level filters and return a paginated list of matching employee doctypes and the total count.

    Args:
        employee_name (str | None): Partial name filter (LIKE "%name%"). Defaults to None.
        department (list | str | None): JSON-encoded list of department names. Defaults to None.
        project (list | str | None): JSON-encoded list of project names. Resolves to
            employee IDs via DocShare. Defaults to None.
        page_length (int): Number of records to return. Defaults to 10.
        start (int): Pagination offset. Defaults to 0.
        user_group (list | str | None): JSON-encoded list of User Group names. Resolves
            to employee IDs via User Group Member. Defaults to None.
        status (list | str | None): JSON-encoded list of statuses (e.g. ["Active"]).
            Defaults to None (no status filter unless set by caller).
        ids (list[str] | None): Explicit list of employee IDs to restrict results to.
            Takes priority alongside other filters (ANDed). Defaults to None.
        reports_to (list | str | None): Employee ID or JSON-encoded list of IDs; restricts
            to direct reports of any of the given managers. Defaults to None.
        business_unit (list | str | None): JSON-encoded list of business unit values
            (custom_business_unit field). Defaults to None.
        designation (list | str | None): JSON-encoded list of designations. Defaults to None.
        roles (list | str | None): JSON-encoded list of Frappe role names. Resolves to
            employee IDs via Has Role. Defaults to None.
        ignore_default_filters (bool): When True, removes the default status filter.
            Defaults to False.
        ignore_permissions (bool): Passed to `get_list`; auto-set to True for
            Timesheet User / Timesheet Manager roles. Defaults to False.
        extra_fields (list[str] | None): Additional Employee fields to include beyond
            the default set [name, image, employee_name, department, designation].
            Defaults to None.

    Returns:
        ```py
        employees, total_count = filter_employees(
            employee_name="John",
            status=["Active"],
            page_length=10,
            start=0,
        )

        # employees (list[dict]) — one page of matches, ordered by employee_name
        employees == [
            {
                "name": "HR-EMP-00001",
                "employee_name": "John Doe",
                "image": "/files/photo.jpg",
                "department": "Engineering",
                "designation": "Software Engineer",
            },
        ]

        # total_count (int) — all matches for the filters, ignoring pagination
        total_count == 45
        ```
    """
    import json

    user_roles = get_roles()

    if not ignore_permissions:
        ignore_permissions = set(user_roles).intersection(["Timesheet User", "Timesheet Manager"])

    fields = ["name", "image", "employee_name", "department", "designation"]
    if extra_fields:
        fields.extend(extra_fields)
    employee_ids = []
    filters = {"status": ["in", ["Active"]]}
    or_filters = {}

    if reports_to:
        if isinstance(reports_to, str):
            # if it was a json encoded string, it'll be loaded into a list (multi select)
            try:
                reports_to = json.loads(reports_to)
            # if it was a plain string and not valid JSON, it'll pass through to the else condition below
            except json.JSONDecodeError:
                pass
        if isinstance(reports_to, list):
            filters["reports_to"] = ["in", reports_to]
        else:
            filters["reports_to"] = reports_to

    if isinstance(department, str):
        department = json.loads(department)

    if isinstance(business_unit, str):
        business_unit = json.loads(business_unit)

    if isinstance(designation, str):
        designation = json.loads(designation)

    if isinstance(status, str):
        status = json.loads(status)
        if len(status) > 0:
            filters["status"] = ["in", status]

    if isinstance(status, list):
        if len(status) > 0:
            filters["status"] = ["in", status]

    if isinstance(project, str):
        project = json.loads(project)

    if isinstance(user_group, str):
        user_group = json.loads(user_group)

    if employee_name:
        or_filters["employee_name"] = ["like", f"%{employee_name}%"]

    if department and len(department) > 0:
        filters["department"] = ["in", department]

    if designation and len(designation) > 0:
        filters["designation"] = ["in", designation]

    if business_unit and len(business_unit) > 0 and frappe.get_meta("Employee").has_field("custom_business_unit"):
        filters["custom_business_unit"] = ["in", business_unit]

    if ids:
        employee_ids.extend(ids)

    if project and len(project) > 0:
        project_employee = get_all(
            "DocShare",
            filters={"share_doctype": "Project", "share_name": ["IN", project]},
            pluck="user",
        )
        ids = [get_value("Employee", {"user_id": employee}) for employee in project_employee]
        employee_ids.extend(ids)

    if user_group and len(user_group) > 0:
        users = get_all("User Group Member", pluck="user", filters={"parent": ["in", user_group]})
        ids = [get_value("Employee", {"user_id": user}, cache=True) for user in users]
        employee_ids.extend(ids)

    if isinstance(roles, str):
        roles = json.loads(roles)

    if roles and len(roles) > 0:
        user_ids = get_all(
            "Has Role",
            filters={"role": ["in", roles], "parenttype": "User", "parent": ["!=", "Administrator"]},
            pluck="parent",
        )
        ids = get_all("Employee", filters={"user_id": ["in", user_ids]}, pluck="name")
        employee_ids.extend(ids)

    if len(employee_ids) > 0:
        filters["name"] = ["in", employee_ids]

    if ignore_default_filters:
        filters.pop("status", None)

    employees = get_list(
        "Employee",
        fields=fields,
        or_filters=or_filters,
        filters=filters,
        limit=page_length,
        offset=start,
        ignore_permissions=ignore_permissions,
        order_by="employee_name asc",
    )
    total_count = get_count(
        "Employee",
        filters=filters,
        or_filters=or_filters,
        ignore_permissions=ignore_permissions,
    )

    return employees, total_count


def get_count(
    doctype: str,
    limit: int | None = None,
    distinct: bool = False,
    filters=None,
    or_filters=None,
    ignore_permissions=False,
) -> int:
    from frappe.desk.reportview import execute
    from frappe.query_builder.functions import Count

    fieldname = f"`tab{doctype}`.name"
    subquery = execute(
        doctype,
        fields=[fieldname],
        distinct=distinct,
        filters=filters,
        or_filters=or_filters,
        ignore_permissions=ignore_permissions,
        run=0,
    )
    count_query = frappe.qb.from_(subquery.as_("sub")).select(Count("*").as_("total_count"))
    result = count_query.run(as_dict=True)
    return result[0]["total_count"] if result else 0
