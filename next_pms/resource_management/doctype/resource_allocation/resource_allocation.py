# Copyright (c) 2024, rtCamp and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document

from next_pms.resource_management.api.team import get_resource_management_team_view_data


class ResourceAllocation(Document):
    def on_update(self):
        # Clear all type of allocation related chache if someting is changed in allocation
        get_resource_management_team_view_data.clear_cache()
