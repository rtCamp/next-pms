from frappe import whitelist


@whitelist()
def get_employee_with_role(role: str | list[str]):
    import json

    from frappe import get_all

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
