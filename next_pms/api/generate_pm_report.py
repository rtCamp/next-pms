import json
import time

import frappe
import requests
from frappe import _
from frappe.utils.password import get_decrypted_password

INITIAL_DELAY = 30
POLL_INTERVAL = 15
MAX_POLL_DURATION = 600
MAX_OUTPUT_RETRIES = 3


def get_llm_urls() -> tuple[str, str] | None:
    # URLs are configured in site_config.json:
    summarize_url = frappe.conf.get("llm_summarize_url")
    status_url = frappe.conf.get("llm_status_url")
    if not summarize_url or not status_url:
        frappe.log_error(
            "LLM URLs are not configured. Please set `llm_summarize_url` and `llm_status_url` in site config.",
            "PM Report — Config Error",
        )
        return None
    return summarize_url, status_url


def get_api_key() -> str | None:
    api_key = get_decrypted_password("Timesheet Settings", "Timesheet Settings", "pm_report_api_key")
    if isinstance(api_key, str):
        api_key = api_key.strip()
    if not api_key:
        frappe.log_error(
            "PM Report API key is not configured. Please set it in Timesheet Settings.", "PM Report — Config Error"
        )
        return None
    return api_key


@frappe.whitelist()
def generate_pm_report(
    project: str,
    from_date: str | None = None,
    to_date: str | None = None,
    previous_doc_url: str | None = None,
    selected_repo: str | None = None,
    selected_board: str | None = None,
) -> dict:
    frappe.has_permission("Project", doc=project, ptype="write", throw=True)
    urls = get_llm_urls()
    if not urls:
        return {"status": "error"}
    LLM_SUMMARIZE_URL = urls[0]

    api_key = get_api_key()
    if not api_key:
        return {"status": "error"}
    project_doc = frappe.get_doc("Project", project)

    # Validations
    if not project_doc.get("custom_enable_project_report_generation"):
        frappe.throw(_("Report generation is not enabled for this project."))
    if not project_doc.get("custom_slack_channel_slug"):
        frappe.throw(_("Please add a Slack Channel Slug before generating."))

    if not from_date or not to_date:
        frappe.throw(_("Report dates are missing. Please select a Report Duration."))

    drive_link = project_doc.get("custom_project_drive_link") or ""
    if not drive_link or len(drive_link) < 8:
        frappe.throw(_("Please add a valid Report Drive Link before generating."))

    payload = {
        "llm_model_overrides": {"provider": "google_genai", "model": "gemini-2.5-flash", "temperature": 0.7},
        "project_metadata": {
            "start_date": from_date,
            "end_date": to_date,
            "project_status": project_doc.get("custom_project_rag_status") or "Green",
            "project_name": (project_doc.get("project_name") or "").strip(),
            "drive_link": drive_link,
        },
        **({"previous_doc_url": previous_doc_url} if previous_doc_url else {}),
        "user_metadata": {
            "user_name": frappe.utils.get_fullname(frappe.session.user),
            "user_email": frappe.db.get_value("User", frappe.session.user, "email") or "admin@example.com",
        },
        "github_metadata": get_github_metadata(project_doc, selected_repo=selected_repo, selected_board=selected_board),
        "slack_metadata": {"channel_slug": project_doc.get("custom_slack_channel_slug") or ""},
        "hours_breakdown": get_hours_breakdown(project, from_date, to_date),
    }

    response = None
    try:
        response = requests.post(
            LLM_SUMMARIZE_URL,
            headers={"Content-Type": "application/json", "x-api-key": api_key},
            data=json.dumps(payload),
            timeout=60,
        )
        response.raise_for_status()

        result = response.json()
        run_ids = result.get("run_ids", [])

        if not run_ids:
            frappe.throw(_("No run ID returned from PM Report API."))

        run_id = run_ids[0]

        frappe.enqueue(
            "next_pms.api.generate_pm_report.check_and_save_report",
            project=project,
            run_id=run_id,
            user=frappe.session.user,
            from_date=from_date,
            to_date=to_date,
            queue="long",
            timeout=700,
        )

        return {"status": "triggered"}

    except requests.exceptions.Timeout:
        frappe.throw(_("LLM API timed out. Please try again."))

    except requests.exceptions.RequestException as e:
        error_detail = ""
        try:
            error_detail = response.json() if response else "No response"
        except Exception:
            error_detail = response.text if response else "No response"

        frappe.log_error(
            f"Error: {e!s}\nResponse: {error_detail}\nPayload: {json.dumps(payload, indent=2)}", "PM Report — API Error"
        )
        frappe.throw(f"Failed to trigger PM Report: {e!s}")


def check_and_save_report(project, run_id, user, from_date, to_date):
    output_retry_count = 0

    time.sleep(INITIAL_DELAY)
    poll_start = time.time()

    api_key = get_api_key()
    if not api_key:
        update_report_row(project, run_id, status="Failed", generated_on=frappe.utils.now())
        _notify(project, user, error="PM Report is not configured correctly. Please contact your system administrator.")
        return

    urls = get_llm_urls()
    if not urls:
        update_report_row(project, run_id, status="Failed", generated_on=frappe.utils.now())
        _notify(project, user, error="PM Report is not configured correctly. Please contact your system administrator.")
        return
    LLM_STATUS_URL = urls[1]

    while True:
        elapsed = time.time() - poll_start

        # Timeout check
        if elapsed >= MAX_POLL_DURATION:
            frappe.log_error(f"run_id: {run_id} | project: {project}", "PM Report — Poll Timeout")
            _notify(project, user, error="Polling timed out after 10 minutes.")
            return

        try:
            response = requests.get(f"{LLM_STATUS_URL}/{run_id}", headers={"x-api-key": api_key}, timeout=30)
            response.raise_for_status()
            data = response.json()

            # Empty data — Inngest not ready yet
            if not data or not data.get("data"):
                time.sleep(POLL_INTERVAL)
                continue

            run = data["data"][0]
            status = run.get("status")
            output = run.get("output")

            if status == "Completed":
                document_url = output.get("document_url") if output else None

                if document_url:
                    save_report_to_child_table(
                        project=project,
                        report_link=document_url,
                        date_range=f"{from_date} to {to_date}",
                        generated_on=frappe.utils.now(),
                    )
                    _notify(project, user, doc_link=document_url)
                    _send_bell_notification(project, user, document_url)
                    return

                else:
                    output_retry_count += 1
                    if output_retry_count >= MAX_OUTPUT_RETRIES:
                        _notify(project, user, error="Process completed but no document was generated.")
                        return

            elif status in ("Failed", "Cancelled"):
                frappe.log_error(f"run_id: {run_id} | status: {status}", "PM Report — Failed/Cancelled")
                _notify(project, user, error=f"Report generation {status.lower()}.")
                return

            # "Running" → continue polling

        except Exception:
            frappe.log_error(frappe.get_traceback(), "PM Report — Poll Exception")

        time.sleep(POLL_INTERVAL)


def save_report_to_child_table(project, report_link, date_range, generated_on):
    try:
        project_doc = frappe.get_doc("Project", project)
        project_doc.append(
            "custom_project_reports",
            {"report_link": report_link, "date_range": date_range, "generated_on": generated_on},
        )
        project_doc.save(ignore_permissions=True)
        frappe.db.commit()
    except Exception:
        frappe.log_error(frappe.get_traceback(), "PM Report — Save Error")
        raise


# update_report_row — match by run_id field
def update_report_row(project, run_id, report_link=None, generated_on=None, status=None):
    try:
        project_doc = frappe.get_doc("Project", project)
        for row in project_doc.custom_project_reports:
            if row.run_id == run_id:
                if report_link is not None:
                    row.report_link = report_link
                if generated_on is not None:
                    row.generated_on = generated_on
                if status is not None:
                    row.status = status
                break
        project_doc.save(ignore_permissions=True)
        frappe.db.commit()
    except Exception:
        frappe.log_error(frappe.get_traceback(), "PM Report — Update Row Error")


@frappe.whitelist()
def resync_report(project: str, run_id: str) -> dict:
    """Poll for document_url for a completed run"""
    frappe.has_permission("Project", doc=project, ptype="write", throw=True)

    api_key = get_api_key()
    if not api_key:
        frappe.throw(_("PM Report is not configured. Please contact your system administrator."))

    urls = get_llm_urls()
    if not urls:
        frappe.throw(_("PM Report is not configured. Please contact your system administrator."))
    LLM_STATUS_URL = urls[1]

    project_doc = frappe.get_doc("Project", project)
    matching_row = next(
        (row for row in project_doc.custom_project_reports if row.run_id == run_id and row.status == "Completed"), None
    )
    if not matching_row:
        frappe.throw(_("Invalid run ID or report is not in a resyncable state."))

    RESYNC_POLL_INTERVAL = 10
    RESYNC_MAX_DURATION = 120  # 2 minutes max

    poll_start = time.time()

    try:
        while True:
            elapsed = time.time() - poll_start

            if elapsed >= RESYNC_MAX_DURATION:
                return {"status": "timeout"}

            response = requests.get(
                f"{LLM_STATUS_URL}/{run_id}",
                headers={"x-api-key": api_key},
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()

            if not data or not data.get("data"):
                time.sleep(RESYNC_POLL_INTERVAL)
                continue

            run = data["data"][0]
            status = run.get("status")
            output = run.get("output")

            if status == "Completed":
                document_url = output.get("document_url") if output else None
                if document_url:
                    update_report_row(
                        project=project,
                        run_id=run_id,
                        report_link=document_url,
                        generated_on=frappe.utils.now(),
                        status="Done",
                    )
                    return {"status": "success", "document_url": document_url}

                # Not ready yet — keep polling
                time.sleep(RESYNC_POLL_INTERVAL)
                continue

            # If Failed/Cancelled during resync
            if status in ("Failed", "Cancelled"):
                update_report_row(
                    project=project,
                    run_id=run_id,
                    status="Failed",
                    generated_on=frappe.utils.now(),
                )
                return {"status": "failed"}

            time.sleep(RESYNC_POLL_INTERVAL)

    except Exception:
        frappe.log_error(frappe.get_traceback(), "PM Report — Resync Error")
        frappe.throw(_("Failed to resync report. Please try again."))


def _notify(project, user, doc_link=None, error=None):
    """Send realtime notification to frontend"""
    message = {"project": project}
    if doc_link:
        message["doc_link"] = doc_link
    if error:
        message["error"] = error
    frappe.publish_realtime(event="pm_report_ready", message=message, user=user)


def _send_bell_notification(project, user, document_url):
    """Send Frappe bell notification"""
    try:
        frappe.get_doc(
            {
                "doctype": "Notification Log",
                "subject": f"PM Report Ready: {project}",
                "email_content": f'<a href="{document_url}">📄 View PM Report</a>',
                "for_user": user,
                "document_type": "Project",
                "document_name": project,
                "type": "Alert",
            }
        ).insert(ignore_permissions=True)
    except Exception:
        frappe.log_error(frappe.get_traceback(), "PM Report — Bell Notification Error")


def get_github_metadata(project_doc, selected_repo: str | None = None, selected_board: str | None = None):
    repos = project_doc.get("custom_project_repository_connections") or []
    if selected_repo:
        repo_url = selected_repo
    elif repos:
        repo_url = repos[0].get("github_repository") or ""
    else:
        repo_url = ""

    if repo_url:
        parts = repo_url.rstrip("/").split("/")
        repo_name = parts[-1] if len(parts) >= 1 else project_doc.get("project_name")
        owner_name = parts[-2] if len(parts) >= 2 else "rtCamp"
    else:
        repo_name = project_doc.get("project_name") or ""
        owner_name = "rtCamp"

    if repo_name:
        repo_name = repo_name.strip()
    if owner_name:
        owner_name = owner_name.strip()

    project_board = ""
    if selected_board:
        project_board = selected_board
    elif repo_url:
        try:
            repo_doc = frappe.get_doc("GitHub Repository", repo_url)
            boards = repo_doc.get("project_boards") or []
            if boards:
                project_board = boards[0].board_name
        except Exception:
            pass

    if not project_board:
        project_board = project_doc.get("project_name") or ""

    if project_board:
        project_board = project_board.strip()

    return {"repo_name": repo_name, "owner_name": owner_name, "project_board": project_board}


def get_hours_breakdown(project, from_date, to_date):
    """
    Fetch timesheet hours grouped by task for the report period.
    """
    try:
        # Fetch all timesheet details for this project in date range
        timesheet_details = frappe.db.get_all(
            "Timesheet Detail",
            filters={"project": project, "from_time": ["between", [f"{from_date} 00:00:00", f"{to_date} 23:59:59"]]},
            fields=["task", "hours"],
        )

        if not timesheet_details:
            return []

        # Get unique task IDs
        task_ids = list(set(entry.get("task") for entry in timesheet_details if entry.get("task")))

        # Fetch expected_time for all tasks in a single query
        task_estimates = {}
        if task_ids:
            task_data = frappe.db.get_all(
                "Task", filters={"name": ["in", task_ids]}, fields=["name", "subject", "expected_time"]
            )
            task_estimates = {t["name"]: t for t in task_data}

        # Group by task - sum hours_consumed
        task_map = {}
        for entry in timesheet_details:
            task = entry.get("task") or "No Task"
            if task not in task_map:
                task_map[task] = {"hours_consumed": 0.0, "estimated_hours": 0.0}
            task_map[task]["hours_consumed"] += entry.get("hours") or 0

        # Now add expected_time ONCE per task (after grouping)
        for task_id in task_map:
            if task_id != "No Task" and task_id in task_estimates:
                task_map[task_id]["estimated_hours"] = task_estimates[task_id].get("expected_time") or 0.0

        # Build result with task title
        breakdown = []
        for task_id, data in task_map.items():
            if task_id == "No Task":
                task_title = "No Task"
            else:
                task_title = task_estimates.get(task_id, {}).get("subject") or task_id

            breakdown.append(
                {
                    "task_title": task_title,
                    "estimated_hours": round(data["estimated_hours"], 2),
                    "hours_consumed": round(data["hours_consumed"], 2),
                }
            )

        return breakdown

    except Exception:
        frappe.log_error(frappe.get_traceback(), "PM Report — Hours Breakdown Error")
        return []


def _is_valid_document_url(url: str) -> bool:
    """
    Validate that the document URL is from an expected domain
    """
    from urllib.parse import urlparse

    if not url:
        return False

    try:
        parsed = urlparse(url)
        allowed_domains = [
            "docs.google.com",
        ]
        return parsed.scheme in ("https",) and any(
            parsed.netloc == domain or parsed.netloc.endswith(f".{domain}") for domain in allowed_domains
        )
    except Exception:
        return False


@frappe.whitelist()
def get_repository_project_boards(repository: str | None = None) -> list[str]:
    if not repository:
        return []
    try:
        repo_doc = frappe.get_doc("GitHub Repository", repository)
        return [b.board_name for b in repo_doc.get("project_boards") or [] if b.board_name]
    except Exception:
        return []
