import json
from pathlib import Path

import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

SETUP_DIR = Path(__file__).parent


def install():
    install_custom_fields()
    install_property_setters()


def install_custom_fields():
    custom_fields = json.loads((SETUP_DIR / "custom_fields.json").read_text())
    create_custom_fields(
        {
            doctype: [{**field, "is_system_generated": 1} for field in fields]
            for doctype, fields in custom_fields.items()
            if frappe.db.exists("DocType", doctype)
        },
        ignore_validate=True,
        update=True,
    )


def install_property_setters():
    for ps in json.loads((SETUP_DIR / "property_setters.json").read_text()):
        if is_property_setter_current(ps):
            continue

        frappe.make_property_setter(
            {
                "doctype": ps["doctype"],
                "doctype_or_field": "DocField" if ps["fieldname"] else "DocType",
                "fieldname": ps["fieldname"],
                "property": ps["property"],
                "value": ps["value"],
                "property_type": ps["property_type"],
            },
            validate_fields_for_doctype=False,
            module=ps["module"],
        )


def is_property_setter_current(ps):
    name = f"{ps['doctype']}-{ps['fieldname'] or 'main'}-{ps['property']}"
    existing = frappe.db.get_value(
        "Property Setter", name, ["value", "property_type", "module", "is_system_generated"], as_dict=True
    )
    return bool(
        existing
        and (existing.value or "") == ps["value"]
        and existing.property_type == ps["property_type"]
        and existing.module == ps["module"]
        and existing.is_system_generated
    )
