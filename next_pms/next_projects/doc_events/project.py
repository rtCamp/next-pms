# Copyright (c) 2026, rtCamp and contributors
# For license information, please see license.txt

import frappe

from next_pms.next_projects.api.constant import PROJECT_TRACKING_CACHE_KEY_PREFIX


def clear_cache(doc, method=None):
    frappe.cache().delete_value(f"{PROJECT_TRACKING_CACHE_KEY_PREFIX}::{doc.name}")
