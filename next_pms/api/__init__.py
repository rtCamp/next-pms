import frappe
from frappe import whitelist


@whitelist()
def get_doc_with_meta(doctype, docname):
    """Fetch all fields (excluding non-data fields) and their values categorized under respective tabs."""

    doc = frappe.get_doc(doctype, docname)

    doctype_meta = doc.meta

    tab_fields = {}
    current_tab = "Details"

    permitted_fields = doctype_meta.get_permitted_fieldnames()

    for df in doctype_meta.fields:
        if df.fieldtype == "Tab Break":
            current_tab = df.label
            tab_fields[current_tab] = []
            continue

        if df.fieldtype not in ["Section Break", "Column Break"] and df.fieldname not in permitted_fields:
            continue

        if df.fieldtype in ["Table", "HTML", "HTML Editor", "Text Editor", "Link"]:
            continue

        field_value = doc.get(df.fieldname)

        if current_tab not in tab_fields:
            tab_fields[current_tab] = []

        tab_fields[current_tab].append(
            {
                "label": df.label,
                "fieldname": df.fieldname,
                "fieldtype": df.fieldtype,
                "description": getattr(df, "description", ""),
                "value": field_value,
                "creation": doc.creation,
                "modified": doc.modified,
                "options": getattr(df, "options", None),
                "reqd": getattr(df, "reqd", 0),
                "default": getattr(df, "default", None),
                "read_only": getattr(df, "read_only", 0),
                "hidden": getattr(df, "hidden", 0),
                "precision": getattr(df, "precision", None),
                "in_list_view": getattr(df, "in_list_view", 0),
                "depends_on": getattr(df, "depends_on", None),
            }
        )

    return {"tabs": tab_fields}


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
        df = frappe._dict(fieldname=title_field, fieldtype="Data", label=title_field)
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
        "meta": doc,  # Note: Adding meta to get entire form-view structure
    }


@whitelist()
def get_naming_rule(doctype):
    """Get the naming rule (autoname) and naming series options of any Doctype."""
    meta = frappe.get_meta(doctype)
    naming_rule = meta.get("autoname") or ""
    naming_series_field = naming_rule.split(":")[0]
    naming_series_options = []

    options = ""

    for field in meta.fields:
        if field.fieldname == naming_series_field:
            options = field.options

    naming_series_options = options.split("\n") if options else []

    return {"doctype": doctype, "naming_series_field": naming_series_field, "options": naming_series_options}
