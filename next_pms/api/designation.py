import frappe
from frappe.query_builder import DocType
from frappe.query_builder.functions import Count

DEFAULT_PAGE_LENGTH = 20
MAX_PAGE_LENGTH = 100


def _escape_like(term: str) -> str:
    """Neutralize LIKE wildcards so a `%` in the search box matches literally."""
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@frappe.whitelist(methods=["GET"])
def get_designations(search: str | None = None, page_length: int = DEFAULT_PAGE_LENGTH, start: int = 0) -> list[dict]:
    """Return designations that at least one active employee is mapped to, most used first.

    Drop-in replacement for the `frappe.client.get_list` call the Designation
    dropdown on the allocations page makes, so it returns the same
    `[{"name": ...}]` shape. The list is derived from Employee rather than the
    Designation doctype, so a designation nobody is mapped to is never offered
    as an option. The employee counts only order the result; they are not
    returned. Ties are broken alphabetically to keep paging stable.

    Args:
        search: Case-insensitive substring matched against the designation name.
            LIKE wildcards in the term are escaped. Blank or whitespace-only
            disables the filter.
        page_length: Rows to return in this page. Clamped to 1..100. Frappe's
            whitelist layer coerces the incoming query-string value to int and
            rejects anything non-numeric.
        start: Zero-based offset of the first row to return. Negative values
            are clamped to 0.

    Returns:
        list[dict]: {"name": <designation>} per row, ordered by active-employee
            count descending then name ascending.
    """
    frappe.only_for(["Projects Manager", "Projects User", "Delivery Manager"], message=True)

    page_length = min(max(page_length, 1), MAX_PAGE_LENGTH)
    start = max(start, 0)

    search = (search or "").strip()

    Employee = DocType("Employee")
    query = (
        frappe.qb.from_(Employee)
        .where(Employee.status == "Active")
        .where(Employee.designation.isnotnull())
        .where(Employee.designation != "")
        .select(Employee.designation.as_("name"))
        .groupby(Employee.designation)
        .orderby(Count("*"), order=frappe.qb.desc)
        .orderby(Employee.designation)
        .limit(page_length)
        .offset(start)
    )

    if search:
        query = query.where(Employee.designation.like(f"%{_escape_like(search)}%"))

    return query.run(as_dict=True)
