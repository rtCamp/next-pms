# `get_project_emails` — test cases

`test_email.py` covers `next_pms.next_projects.api.email.get_project_emails`. All fixtures
are built once in `setUpClass` (IntegrationTestCase rolls back only per class), and the
Gmail dependency is mocked so no `Gmail Thread` docs are needed.

| # | Test | What it checks |
|---|------|----------------|
| 1 | `test_denied_role_raises_permission_error` | A user without an allowed role gets `PermissionError` from the `only_for` gate. |
| 2 | `test_missing_project_raises` | An empty `project` argument raises `ValidationError` ("Project is required"). |
| 3 | `test_unknown_project_raises_does_not_exist` | A non-existent project name raises `DoesNotExistError`. |
| 4 | `test_returns_only_project_email_communications` | Returns only the project's `Email` communications with correct field mapping — Phone-medium and other-project mail excluded. |
| 5 | `test_attachments_grouped_per_communication` | File attachments attach to the right communication (`file_url`+`is_private`) and don't leak to siblings. |
| 6 | `test_empty_project_returns_empty_list` | A project with no communications (and no Gmail) returns `[]`. |
| 7 | `test_gmail_not_installed_skips_threads` | When `frappe_gmail_thread` isn't installed, only communications are returned. |
| 8 | `test_gmail_threads_appended_with_unique_ids` | Gmail emails are appended after communications, each with a synthesized unique id (`{thread}-{creation}`). |
| 9 | `test_gmail_attachments_passed_through` | Attachments on a Gmail email doc are preserved through `_to_email`. |

## Run

```bash
docker exec -u frappe -w /workspace/frappe-bench fm__erpv16_localhost__frappe \
  bench --site erpv16.localhost run-tests \
  --module next_pms.tests.next_projects.api.test_email
```
