import json

from erpnext.accounts.report.utils import get_rate_as_at
from frappe import get_list, get_meta, whitelist
from frappe.utils import flt, getdate


@whitelist()
def get_projects(
    limit_start=0,
    limit=20,
    currency=None,
    fields=None,
    filters=None,
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
        limit_start=limit_start,
        limit=limit,
        order_by=order_by,
    )

    if not currency or len(currency) == 0:
        return project_lists

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
    return project_lists


def get_currency_fields(meta_fields):
    currency_fields = []

    for field in meta_fields:
        if field.fieldtype == "Currency":
            currency_fields.append(field.fieldname)
    return currency_fields


def convert(value, rate):
    converted_value = flt(value) * (rate or 1)
    return converted_value
