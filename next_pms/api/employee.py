import frappe
from frappe import _
from frappe.utils import flt

from next_pms.utils.employee import get_income_tax_slab


@frappe.whitelist(methods=["GET"])
@frappe.read_only()
def get_own_salary_summary(employee: str) -> dict:
    """Return the salary summary of the session user's own Employee record.

    The Employee form shows it to users who can't read the permlevel-1 salary fields, so it
    reads the record directly and only for the caller's own Employee.

    Args:
        employee (str): Employee ID linked to the session user.

    Returns:
        dict: ctc, salary_currency, monthly_salary, income_tax_slab, bank_name, bank_ac_no,
        ifsc_code and, when the field exists, custom_bank_branch.
    """
    fields = ["name", "ctc", "salary_currency", "bank_name", "bank_ac_no", "ifsc_code"]
    if frappe.get_meta("Employee").has_field("custom_bank_branch"):
        fields.append("custom_bank_branch")

    record = frappe.db.get_value("Employee", {"name": employee, "user_id": frappe.session.user}, fields, as_dict=True)
    if not record:
        frappe.throw(_("You can only view the salary summary of your own Employee record."), frappe.PermissionError)

    record.monthly_salary = flt(record.ctc) / 12
    record.income_tax_slab = get_income_tax_slab(record.pop("name"))
    return record
