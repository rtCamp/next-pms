import frappe
from frappe import _
from frappe.model.document import Document


class AIStaffingSettings(Document):
    def validate(self):
        if self.enabled and not self.qualifying_stages:
            frappe.throw(_("Add at least one qualifying Sales Stage before enabling AI staffing."))
