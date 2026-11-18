import json

import frappe
from frappe import _

SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]


def get_values(sheet_id: str, tab: str) -> list[list[str]]:
    """Every formatted cell value of one tab, as ragged rows (trailing blanks omitted)."""
    from googleapiclient.errors import HttpError

    credentials = _credentials()
    try:
        result = (
            _sheets_service(credentials)
            .spreadsheets()
            .values()
            .get(spreadsheetId=sheet_id, range=f"'{tab}'!A1:Z500", valueRenderOption="FORMATTED_VALUE")
            .execute()
        )
    except HttpError as e:
        if e.resp.status in (403, 404):
            frappe.throw(
                _("Cannot read tab {0} of SOW sheet {1}. Share the sheet with {2}.").format(
                    tab, sheet_id, credentials.service_account_email
                )
            )
        raise
    return result.get("values", [])


def _credentials():
    from google.oauth2.service_account import Credentials

    key = frappe.get_single("AI Staffing Settings").get_password("google_service_account_json", raise_exception=False)
    if not key:
        frappe.throw(_("Set the Google service account key in AI Staffing Settings."))
    try:
        info = json.loads(key)
    except ValueError:
        frappe.throw(_("The Google service account key in AI Staffing Settings is not valid JSON."))
    return Credentials.from_service_account_info(info, scopes=SCOPES)


def _sheets_service(credentials):
    from googleapiclient.discovery import build

    return build("sheets", "v4", credentials=credentials, cache_discovery=False)
