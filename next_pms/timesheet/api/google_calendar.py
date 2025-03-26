from datetime import datetime

import frappe
from frappe import _
from frappe.integrations.doctype.google_calendar.google_calendar import (
    get_google_calendar_object,
)


class GoogleBadRequest(Exception):
    pass


@frappe.whitelist()
def get_user_calendar_events(member: str, start_date: datetime, end_date: datetime):
    """
    Fetch all calendar events for the current user.

    Args:
        start (str, optional): Start date for filtering events. Defaults to None.
        end (str, optional): End date for filtering events. Defaults to None.

    Returns:
        list: List of calendar events for the user
    """
    try:
        if not member:
            return None
        google_calendar_id = frappe.get_value("User Appointment Availability", member, "google_calendar")
        google_calendar = frappe.get_doc("Google Calendar", google_calendar_id)
        google_calendar_api_obj, account = get_google_calendar_object(google_calendar.name)
        time_min = datetime(start_date.year, start_date.month, start_date.day, 0, 0, 0)
        time_max = datetime(end_date.year, end_date.month, end_date.day, 23, 59, 59)
        time_min_str = time_min.isoformat() + "Z"
        time_max_str = time_max.isoformat() + "Z"
        events = (
            google_calendar_api_obj.events()
            .list(
                calendarId=google_calendar.google_calendar_id,
                maxResults=2000,
                singleEvents=True,
                timeMax=time_max_str,
                timeMin=time_min_str,
                orderBy="startTime",
            )
            .execute()
        )
        return events
    except Exception:
        raise GoogleBadRequest(_("Google Calendar - Could not create Google Calendar API object."))
