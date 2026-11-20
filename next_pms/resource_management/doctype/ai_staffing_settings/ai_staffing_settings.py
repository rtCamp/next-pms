import frappe
from frappe import _
from frappe.model.document import Document

from next_pms.resource_management.ai_staffing import crm_xt_installed


class AIStaffingSettings(Document):
    def validate(self):
        if not self.enabled:
            return
        if not crm_xt_installed():
            frappe.throw(_("Install the Frappe CRM XT app (frappe_crm_xt) before enabling AI staffing."))
        if not self.qualifying_stages:
            frappe.throw(_("Add at least one qualifying Sales Stage before enabling AI staffing."))
