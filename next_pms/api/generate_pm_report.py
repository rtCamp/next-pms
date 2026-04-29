import frappe
import requests
import json
import time

LLM_SUMMARIZE_URL  = "https://rt-report-automation.rt.gw/api/llm/summarize"
LLM_STATUS_URL     = "https://rt-report-automation.rt.gw/api/inngest/runs"

INITIAL_DELAY      = 30
POLL_INTERVAL      = 15
MAX_POLL_DURATION  = 600
MAX_OUTPUT_RETRIES = 3


def get_api_key():
    return frappe.conf.get("pm_report_api_key") or ""


@frappe.whitelist()
def generate_pm_report(project, from_date=None, to_date=None, previous_doc_url=None):
    project_doc = frappe.get_doc("Project", project)

    # Validations
    if not project_doc.get("custom_slack_channel_slug"):
        frappe.throw("Please add a Slack Channel Slug before generating.")
    if not from_date or not to_date:
        frappe.throw("Report dates are missing. Please select a Report Duration.")

    drive_link = project_doc.get("custom_project_drive_link") or ""
    if not drive_link or len(drive_link) < 8:
        frappe.throw("Please add a valid Report Drive Link before generating.")

    payload = {
        "llm_model_overrides": {
            "provider":    "google_genai",
            "model":       "gemini-2.5-flash",
            "temperature": 0.7
        },
        "project_metadata": {
            "start_date":     from_date,
            "end_date":       to_date,
            "project_status": project_doc.get("custom_project_rag_status") or "Green",
            "project_name":   project_doc.get("project_name") or "",
            "drive_link":     drive_link,
        },
        **({"previous_doc_url": previous_doc_url} if previous_doc_url else {}),
        "user_metadata": {
            "user_name":  frappe.session.user,
            "user_email": frappe.session.user
        },
        "github_metadata": get_github_metadata(project_doc),
        "slack_metadata": {
            "channel_slug": project_doc.get("custom_slack_channel_slug") or ""
        }
    }

    response = None
    try:
        response = requests.post(
            LLM_SUMMARIZE_URL,
            headers={
                "Content-Type": "application/json",
                "x-api-key":    get_api_key()
            },
            data=json.dumps(payload),
            timeout=60
        )
        response.raise_for_status()

        result  = response.json()
        run_ids = result.get("run_ids", [])

        if not run_ids:
            frappe.throw("No run ID returned from PM Report API.")

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
        frappe.throw("LLM API timed out. Please try again.")

    except requests.exceptions.RequestException as e:
        error_detail = ""
        try:
            error_detail = response.json() if response else "No response"
        except Exception:
            error_detail = response.text if response else "No response"

        frappe.log_error(
            f"Error: {str(e)}\nResponse: {error_detail}\nPayload: {json.dumps(payload, indent=2)}",
            "PM Report — API Error"
        )
        frappe.throw(f"Failed to trigger PM Report: {str(e)}")


def check_and_save_report(project, run_id, user, from_date, to_date):
    output_retry_count = 0

    time.sleep(INITIAL_DELAY)
    poll_start = time.time()

    while True:
        elapsed = time.time() - poll_start

        # Timeout check
        if elapsed >= MAX_POLL_DURATION:
            frappe.log_error(
                f"run_id: {run_id} | project: {project}",
                "PM Report — Poll Timeout"
            )
            _notify(project, user, error="Polling timed out after 10 minutes.")
            return

        try:
            response = requests.get(
                f"{LLM_STATUS_URL}/{run_id}",
                headers={"x-api-key": get_api_key()},
                timeout=30
            )
            response.raise_for_status()
            data = response.json()

            # Empty data — Inngest not ready yet
            if not data or not data.get("data"):
                time.sleep(POLL_INTERVAL)
                continue

            run    = data["data"][0]
            status = run.get("status")
            output = run.get("output")

            if status == "Completed":
                document_url = output.get("document_url") if output else None

                if document_url:
                    save_report_to_child_table(
                        project=project,
                        report_link=document_url,
                        date_range=f"{from_date} to {to_date}",
                        generated_on=frappe.utils.now()
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
                frappe.log_error(
                    f"run_id: {run_id} | status: {status}",
                    "PM Report — Failed/Cancelled"
                )
                _notify(project, user, error=f"Report generation {status.lower()}.")
                return

            # "Running" → continue polling

        except Exception:
            frappe.log_error(frappe.get_traceback(), "PM Report — Poll Exception")

        time.sleep(POLL_INTERVAL)


def save_report_to_child_table(project, report_link, date_range, generated_on):
    try:
        project_doc = frappe.get_doc("Project", project)
        project_doc.append("custom_project_reports", {
            "report_link":  report_link,
            "date_range":   date_range,
            "generated_on": generated_on
        })
        project_doc.save(ignore_permissions=True)
        frappe.db.commit()
    except Exception:
        frappe.log_error(frappe.get_traceback(), "PM Report — Save Error")


def _notify(project, user, doc_link=None, error=None):
    """Send realtime notification to frontend"""
    message = {"project": project}
    if doc_link:
        message["doc_link"] = doc_link
    if error:
        message["error"] = error
    frappe.publish_realtime(
        event="pm_report_ready",
        message=message,
        user=user
    )


def _send_bell_notification(project, user, document_url):
    """Send Frappe bell notification"""
    try:
        frappe.get_doc({
            "doctype":       "Notification Log",
            "subject":       f"PM Report Ready: {project}",
            "email_content": f'<a href="{document_url}">📄 View PM Report</a>',
            "for_user":      user,
            "document_type": "Project",
            "document_name": project,
            "type":          "Alert"
        }).insert(ignore_permissions=True)
    except Exception:
        frappe.log_error(frappe.get_traceback(), "PM Report — Bell Notification Error")


def get_github_metadata(project_doc):
    repos = project_doc.get("custom_project_repository_connections") or []
    if repos:
        repo_url   = repos[0].get("github_repository") or ""
        parts      = repo_url.rstrip("/").split("/")
        repo_name  = parts[-1] if len(parts) >= 1 else project_doc.get("project_name")
        owner_name = parts[-2] if len(parts) >= 2 else "rtCamp"
    else:
        repo_name  = project_doc.get("project_name") or ""
        owner_name = "rtCamp"

    return {
        "repo_name":     repo_name,
        "owner_name":    owner_name,
        "project_board": project_doc.get("project_name") or ""
    }