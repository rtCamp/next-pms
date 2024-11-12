import frappe
from frappe.utils.data import get_url_to_form


def generate_the_error_log(
    title: str,
    msg: str = None,
    is_mute_message: str = False,
    user_error_message: str = "The data for timesheet billing sync has failed.",
) -> None:
    if not msg:
        msg = frappe.get_traceback()

    frappe.log_error(
        title,
        msg,
    )

    if is_mute_message:
        return

    error_log_link = get_url_to_form("Error Log", frappe.db.get_value("Error Log", {"method": title}, "name"))

    frappe.msgprint(
        f"{user_error_message} Please check the <a href='{error_log_link}'>Error Log</a> for more information.",
        realtime=True,
    )
