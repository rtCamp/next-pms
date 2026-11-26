# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import escape_html


class CustomerFeedbackSettings(Document):
    pass


def get_branding() -> dict:
    """Brand title, logo and support email for the public feedback pages, with fallbacks."""
    settings = frappe.get_cached_doc("Customer Feedback Settings")
    return {
        "brand_title": settings.brand_title,
        "brand_logo": settings.brand_logo
        or frappe.db.get_single_value("Website Settings", "app_logo")
        or "/assets/next_pms/next-pms-logo.png",
        "support_email": settings.support_email,
    }


def get_fetch_error_message(support_email: str | None) -> str:
    """Error shown when a feedback link cannot be resolved, naming the support address when one is set."""
    if not support_email:
        return _("There has been an error fetching the form. Please contact support with error details.")
    email = escape_html(support_email)
    return _(
        "There has been an error fetching the form. Please contact <a href='mailto:{0}'>{0}</a> with error details."
    ).format(email)
