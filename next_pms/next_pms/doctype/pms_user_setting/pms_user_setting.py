# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class PMSUserSetting(Document):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from frappe.types import DF

        auto_expand_weeks_by_default: DF.Int
        use_system_auto_expand_weeks: DF.Check
        user: DF.Link
    # end: auto-generated types

    pass


def _validate_non_negative_int(value: int | float | str | None) -> int | None:
    """Normalize an optional non-negative integer setting."""
    if value in (None, ""):
        return None

    if isinstance(value, bool) or (isinstance(value, float) and not value.is_integer()):
        frappe.throw(
            frappe._("Value must be a non-negative whole number."),
            frappe.ValidationError,
        )

    try:
        value = int(value)
    except TypeError, ValueError:
        frappe.throw(
            frappe._("Value must be a non-negative whole number."),
            frappe.ValidationError,
        )

    if value < 0:
        frappe.throw(
            frappe._("Value must be a non-negative whole number."),
            frappe.ValidationError,
        )
    return value


EDITABLE_SETTINGS = {
    "auto_expand_weeks_by_default": _validate_non_negative_int,
    "use_system_auto_expand_weeks": None,
}

DEFAULT_AUTO_EXPAND_WEEKS = 4


def _get_system_auto_expand_weeks() -> int:
    """Return the global Timesheet auto-expand setting with an application fallback."""
    value = frappe.db.get_single_value("Timesheet Settings", "auto_expand_weeks_by_default")
    return value if value is not None else DEFAULT_AUTO_EXPAND_WEEKS


def _get_or_create_settings() -> PMSUserSetting:
    """Return or create the current Employee's settings document."""
    frappe.only_for(["Employee"], message=True)
    user = frappe.session.user
    if frappe.db.exists("PMS User Setting", user):
        return frappe.get_doc("PMS User Setting", user)

    settings = frappe.new_doc("PMS User Setting")
    settings.user = user
    try:
        settings.insert(ignore_permissions=True)
    except frappe.DuplicateEntryError:
        return frappe.get_doc("PMS User Setting", user)
    frappe.db.commit()  # nosemgrep Persist first-time settings document creation during a GET request.
    return settings


@frappe.whitelist(methods=["GET"])
def get_pms_settings() -> dict:
    """Return supported PMS settings for the current Employee.

    Returns:
        dict: The user's PMS settings containing:
            - auto_expand_weeks_by_default: Number of weeks to expand by default, or None.
            - use_system_auto_expand_weeks: Whether to use the system default.
            - system_auto_expand_weeks_by_default: Global auto-expand weeks setting.
    """
    settings_doc = _get_or_create_settings()
    return {
        "auto_expand_weeks_by_default": settings_doc.auto_expand_weeks_by_default,
        "use_system_auto_expand_weeks": settings_doc.use_system_auto_expand_weeks,
        "system_auto_expand_weeks_by_default": _get_system_auto_expand_weeks(),
    }


@frappe.whitelist(methods=["POST"])
def update_pms_settings(settings: dict) -> dict:
    """Update supported PMS settings for the current Employee.

    Args:
        settings: Mapping of supported setting field names to their values.

    Returns:
        dict: The updated PMS settings containing:
            - auto_expand_weeks_by_default: Number of weeks to expand by default, or None.
            - use_system_auto_expand_weeks: Whether to use the system default.
            - system_auto_expand_weeks_by_default: Global auto-expand weeks setting.
    """
    unknown_settings = set(settings) - EDITABLE_SETTINGS.keys()
    if unknown_settings:
        frappe.throw(frappe._("Unsupported PMS setting."), frappe.ValidationError)

    frappe.only_for(["Employee"], message=True)
    settings_doc = frappe.get_doc("PMS User Setting", frappe.session.user)
    for fieldname, value in settings.items():
        validator = EDITABLE_SETTINGS[fieldname]
        if validator:
            value = validator(value)
        setattr(settings_doc, fieldname, value)
    settings_doc.save()

    return {
        "auto_expand_weeks_by_default": settings_doc.auto_expand_weeks_by_default,
        "use_system_auto_expand_weeks": settings_doc.use_system_auto_expand_weeks,
        "system_auto_expand_weeks_by_default": _get_system_auto_expand_weeks(),
    }
