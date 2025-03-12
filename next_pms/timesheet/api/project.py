import json

from erpnext.accounts.report.utils import get_rate_as_at
from frappe import get_doc, get_list, get_meta, whitelist
from frappe.utils import flt, getdate

from . import get_count


@whitelist()
def get_projects(
    limit=20,
    currency=None,
    fields=None,
    filters=None,
    start=0,
    order_by="modified desc",
):
    meta = get_meta("Project")
    if isinstance(fields, str):
        fields = json.loads(fields)
    if isinstance(filters, str):
        filters = json.loads(filters)

    if not fields:
        fields = meta.default_fields

    if "custom_currency" not in fields:
        fields.append("custom_currency")

    project_lists = get_list(
        "Project",
        fields=fields,
        filters=filters,
        limit_start=start,
        limit=limit,
        order_by=order_by,
    )
    count = get_count("Project", filters=filters)
    if not currency or len(currency) == 0:
        return {
            "data": project_lists,
            "has_more": int(start) + int(limit) < count,
            "total_count": count,
        }

    currency_fields = get_currency_fields(meta.fields)
    date = getdate()

    for project in project_lists:
        project_currency = project.custom_currency
        if project_currency == currency:
            continue
        rate = get_rate_as_at(date, project_currency, currency)
        for field in currency_fields:
            if field in project:
                project[field] = convert(project.get(field), rate)

    return {
        "data": project_lists,
        "has_more": int(start) + int(limit) < count,
        "total_count": count,
    }


def get_currency_fields(meta_fields):
    currency_fields = []

    for field in meta_fields:
        if field.fieldtype == "Currency":
            currency_fields.append(field.fieldname)
    return currency_fields


def convert(value, rate):
    converted_value = flt(value) * (rate or 1)
    return converted_value


@whitelist()
def get_project_details(name):
    """Fetch all fields (excluding non-data fields) and their values categorized under respective tabs."""
    doctype_meta = get_meta("Project")
    project_doc = get_doc("Project", name)

    tab_fields = {}
    current_tab = "Details"  # Default tab for fields before first Tab Break

    for df in doctype_meta.fields:
        if df.fieldtype in ["Section Break", "Column Break"]:
            continue

        if df.fieldtype == "Tab Break":
            current_tab = df.label
            tab_fields[current_tab] = []
            continue

        field_value = project_doc.get(df.fieldname)

        if df.fieldtype == "Table" and field_value:
            child_table_data = [{field: getattr(row, field) for field in row.as_dict().keys()} for row in field_value]
            field_value = child_table_data

        if current_tab not in tab_fields:
            tab_fields[current_tab] = []

        tab_fields[current_tab].append(
            {"label": df.label, "fieldname": df.fieldname, "fieldtype": df.fieldtype, "value": field_value}
        )

    return {"tabs": list(tab_fields.keys()), "fields_by_tab": tab_fields}


@whitelist()
def get_project_list(project_name=None, page_length=10, start=0, status=None, ignore_permissions=False):
    fields = ["name", "project_name"]
    filters = {"status": ["in", ["Open"]]}
    or_filters = {}

    if isinstance(status, str):
        status = json.loads(status)
        if len(status) > 0:
            filters["status"] = ["in", status]

    if isinstance(status, list):
        if len(status) > 0:
            filters["status"] = ["in", status]

    if project_name:
        or_filters["project_name"] = ["like", f"%{project_name}%"]

    projects = get_list(
        "Project",
        fields=fields,
        filters=filters,
        or_filters=or_filters,
        page_length=page_length,
        start=start,
        ignore_permissions=ignore_permissions,
        order_by="project_name asc",
    )

    return projects
