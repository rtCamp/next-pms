from frappe import _dict, get_all, whitelist


@whitelist()
def get_data(user: str = None):
    return {"roles": get_current_user_roles(user), "currencies": get_currencies()}


@whitelist()
def get_current_user_roles(user: str = None):
    import frappe

    if not user:
        user = frappe.session.user
    roles = frappe.get_roles(user)
    return roles


def get_currencies():
    return get_all("Currency", pluck="name", filters={"enabled": 1})


@whitelist()
def get_doc_meta(doctype: str):
    from frappe import get_meta
    from frappe.model import default_fields
    from frappe.model.meta import get_default_df

    default_fields = list(default_fields)
    default_fields.remove("doctype")
    default_fields.remove("idx")
    default_fields.remove("docstatus")

    doc = get_meta(doctype)
    # Get the permitted fields based on the user's permission
    permitted_fields = doc.get_permitted_fieldnames()
    # create df property map for these fields
    permitted_fields = [field for field in doc.fields if field.fieldname in permitted_fields]

    # add default fields to permitted fields
    for field in default_fields:
        if field not in permitted_fields:
            df = get_default_df(field)
            df.label = field
            permitted_fields.append(df)

    # Create map for default fields
    default_list_fields = [field for field in permitted_fields if field.in_list_view]

    # Check if title field is present in the default fields,if not then add it.
    title_field = doc.get_title_field()
    title_field_exists = any(field.fieldname == title_field for field in default_list_fields)

    if not title_field_exists:
        df = _dict(fieldname=title_field, fieldtype="Data", label=title_field)
        default_list_fields.append(df)

    # Reorder the permitted_fields based on the order in doc.fields
    field_order = {field.fieldname: idx for idx, field in enumerate(doc.fields)}
    permitted_fields.sort(key=lambda field: field_order.get(field.fieldname, float("inf")))
    default_list_fields.sort(key=lambda field: field_order.get(field.fieldname, float("inf")))

    return {
        "fields": permitted_fields,
        "default_fields": default_list_fields,
        "doctype": doctype,
        "title_field": title_field,
    }
