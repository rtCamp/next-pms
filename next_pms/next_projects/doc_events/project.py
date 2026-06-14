# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe


def clear_cache(doc, method=None):
    frappe.cache().delete_value(f"next_pms:project_tracking::{doc.name}")
