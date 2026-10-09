"""Seed a fresh Frappe site with the baseline the Playwright e2e suite assumes.

The suite was written against a shared staging site; its globalSetup only creates per-test records
(projects, tasks, timesheets, throwaway employees). Everything else is created here.

Run (idempotent), from the bench directory:

    PYTHONPATH=$GITHUB_WORKSPACE/tests/e2e/ci \
    E2E_PASSWORD=... E2E_ENV_OUT=/tmp/e2e.env \
    bench --site test_site execute seed.run

Writes KEY=VALUE lines (the *_ID / *_EMAIL / *_PASS / *_NAME variables the suite reads) to E2E_ENV_OUT.
"""

import os

import frappe
from frappe.utils import getdate, today

COMPANY = "rtCamp Solutions Pvt. Ltd."
ABBR = "RT"
PASSWORD = os.environ.get("E2E_PASSWORD", "")

# Names must not be substrings of each other: TC38 expects a search for one name to return one row.
PERSONAS = {
	"REP_MAN": {"first": "Marcus", "last": "Thorne", "roles": ["Projects Manager", "Timesheet Manager"]},
	"EMP": {"first": "Priya", "last": "Raman", "roles": []},
	"EMP2": {"first": "Daniel", "last": "Okafor", "roles": []},
	"EMP3": {"first": "Lena", "last": "Fischer", "roles": [], "business_unit": "Polaris"},
}
# Reportees of the manager. EMP2 stays outside the roster (TC53 compares the page with reports_to).
REPORTEES = ("EMP", "EMP3")
FILLERS = 12  # TC57 needs members outside the manager's team on the first 10-row page

CUSTOMERS = {"Acme Corporation": "INR", "QA-INR": "INR", "QA: EUR": "EUR", "rtCamp": "INR"}
PROJECT_TYPES = ("Fixed Cost", "Non Billable", "Retainer", "TnM")
BUSINESS_UNITS = ("Polaris", "Jupiter", "NB")
# directed pair -> rate; round numbers so cost assertions (toBeCloseTo 3 digits) are stable
RATES = {
	("USD", "INR"): 80,
	("INR", "USD"): 0.0125,
	("EUR", "INR"): 90,
	("INR", "EUR"): 0.0111111,
	("EUR", "USD"): 1.125,
	("USD", "EUR"): 0.888889,
}
# CTC / (12 * 160) is round for 1_920_000 (see timesheetHelper hourly billing formula)
CTC = 1_920_000


def run():
	frappe.set_user("Administrator")
	setup_wizard()
	site_settings()
	currencies()
	holiday_list()
	masters()
	business_unit_customization()
	permission_patches()
	personas = create_personas()
	write_env(personas)
	frappe.db.commit()
	frappe.clear_cache()


def setup_wizard():
	from frappe.desk.page.setup_wizard.setup_wizard import setup_complete

	if frappe.db.get_single_value("System Settings", "setup_complete"):
		return
	year = getdate(today()).year
	setup_complete(
		{
			"currency": "INR",
			"full_name": "CI Admin",
			"company_name": COMPANY,
			"timezone": "Asia/Kolkata",
			"company_abbr": ABBR,
			"industry": "Technology",
			"country": "India",
			"fy_start_date": f"{year}-01-01",
			"fy_end_date": f"{year}-12-31",
			"language": "english",
			"company_tagline": "e2e",
			"email": "ci-admin@example.com",
			"password": PASSWORD,
			"chart_of_accounts": "Standard",
			"domains": ["Services"],
		}
	)
	frappe.db.commit()


def site_settings():
	ss = frappe.get_doc("System Settings")
	ss.time_zone = "Asia/Kolkata"
	ss.first_day_of_the_week = "Monday"
	ss.enable_password_policy = 0
	ss.save()

	gd = frappe.get_doc("Global Defaults")
	gd.default_company = COMPANY
	gd.default_currency = "INR"
	gd.save()

	# Tests book time on arbitrary weekdays of the current week via UI and API.
	ts = frappe.get_doc("Timesheet Settings")
	ts.allow_future_entries = 1
	ts.allow_backdated_entries = 1
	ts.allow_backdated_entries_till_employee = 30
	ts.allow_backdated_entries_till_manager = 30
	ts.save()

	# The Add Leave dialog posts no leave_approver, so HRMS must not demand one.
	frappe.db.set_single_value("HR Settings", "leave_approver_mandatory_in_leave_application", 0)

	# Entries on the same day share identical from/to times.
	ps = frappe.get_doc("Projects Settings")
	ps.ignore_user_time_overlap = 1
	ps.ignore_employee_time_overlap = 1
	ps.save()


def currencies():
	for code in ("INR", "USD", "EUR"):
		frappe.db.set_value("Currency", code, "enabled", 1)
	for (src, dst), rate in RATES.items():
		if frappe.db.exists("Currency Exchange", {"from_currency": src, "to_currency": dst}):
			continue
		frappe.get_doc(
			{
				"doctype": "Currency Exchange",
				"date": "2020-01-01",
				"from_currency": src,
				"to_currency": dst,
				"exchange_rate": rate,
				"for_buying": 1,
				"for_selling": 1,
			}
		).insert()


def holiday_list():
	name = "E2E Holidays"
	if not frappe.db.exists("Holiday List", name):
		frappe.get_doc(
			{
				"doctype": "Holiday List",
				"holiday_list_name": name,
				"from_date": "2020-01-01",
				"to_date": "2035-12-31",
			}
		).insert()
	frappe.db.set_value("Company", COMPANY, "default_holiday_list", name)
	# HRMS v16 resolves an employee's holiday list from assignments only (Employee.holiday_list and the
	# Company default are ignored): without this, Leave Application inserts fail with "No Holiday List was found".
	if not frappe.db.exists(
		"Holiday List Assignment", {"applicable_for": "Company", "assigned_to": COMPANY, "docstatus": 1}
	):
		frappe.get_doc(
			{
				"doctype": "Holiday List Assignment",
				"applicable_for": "Company",
				"assigned_to": COMPANY,
				"holiday_list": name,
				"from_date": "2020-01-01",
			}
		).insert().submit()


def masters():
	for name, currency in CUSTOMERS.items():
		if not frappe.db.exists("Customer", name):
			frappe.get_doc(
				{
					"doctype": "Customer",
					"customer_name": name,
					"customer_type": "Company",
					"default_currency": currency,
				}
			).insert()
	for name in PROJECT_TYPES:
		if not frappe.db.exists("Project Type", name):
			frappe.get_doc({"doctype": "Project Type", "project_type": name}).insert()
	# The Add Leave dialog lists LWP types only.
	if not frappe.db.exists("Leave Type", "Unpaid Time Off"):
		frappe.get_doc({"doctype": "Leave Type", "leave_type_name": "Unpaid Time Off", "is_lwp": 1}).insert()


def business_unit_customization():
	"""Stand-in for what the private `rtcamp` app ships: Business Unit + two Employee/Project fields."""
	if not frappe.db.exists("DocType", "Business Unit"):
		frappe.get_doc(
			{
				"doctype": "DocType",
				"name": "Business Unit",
				"module": "Projects",
				"custom": 1,
				"autoname": "field:business_unit_name",
				"fields": [
					{"fieldname": "business_unit_name", "label": "Business Unit Name", "fieldtype": "Data", "reqd": 1, "unique": 1}
				],
				"permissions": [
					{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1},
					{"role": "Projects Manager", "read": 1},
					{"role": "Employee", "read": 1},
				],
			}
		).insert()
	for name in BUSINESS_UNITS:
		if not frappe.db.exists("Business Unit", name):
			frappe.get_doc({"doctype": "Business Unit", "business_unit_name": name}).insert()

	fields = {
		"Employee": [
			{"fieldname": "custom_business_unit", "label": "Business Unit", "fieldtype": "Link", "options": "Business Unit"},
			{"fieldname": "custom_reporting_manager", "label": "Reporting Manager Name", "fieldtype": "Data"},
		],
		"Project": [
			{"fieldname": "custom_business_unit", "label": "Business Unit", "fieldtype": "Link", "options": "Business Unit"},
		],
	}
	for doctype, items in fields.items():
		for df in items:
			if not frappe.db.exists("Custom Field", {"dt": doctype, "fieldname": df["fieldname"]}):
				frappe.get_doc({"doctype": "Custom Field", "dt": doctype, **df}).insert()
	frappe.clear_cache()


def permission_patches():
	# Patches are marked done on a fresh install without running; the suite needs their permissions.
	for path in (
		"next_pms.next_projects.patches.add_customer_permissions_for_projects_manager.execute",
		"next_pms.next_projects.patches.add_designation_permissions_for_pm.execute",
		"next_pms.timesheet.patches.add_project_report_permissions.execute",
	):
		try:
			frappe.get_attr(path)()
		except Exception:
			frappe.log_error(title=f"e2e seed: {path}")
			print(f"WARN: {path} failed")


def create_user(email, first, last, roles):
	if frappe.db.exists("User", email):
		return
	user = frappe.get_doc(
		{
			"doctype": "User",
			"email": email,
			"first_name": first,
			"last_name": last,
			"send_welcome_email": 0,
			"enabled": 1,
			"new_password": PASSWORD,
			"roles": [{"role": r} for r in roles],
		}
	)
	user.flags.no_welcome_mail = True
	user.insert(ignore_permissions=True)


def create_employee(first, last, email=None, **extra):
	name = f"{first} {last}"
	existing = frappe.db.get_value("Employee", {"employee_name": name}, "name")
	if existing:
		return existing, name
	doc = frappe.get_doc(
		{
			"doctype": "Employee",
			"first_name": first,
			"last_name": last,
			"gender": "Male",
			"date_of_birth": "1990-01-01",
			"date_of_joining": "2020-01-01",
			"company": COMPANY,
			"status": "Active",
			"holiday_list": "E2E Holidays",
			"ctc": CTC,
			"salary_currency": "USD",
			"user_id": email,
			"create_user_permission": 0,
			**extra,
		}
	).insert(ignore_permissions=True)
	return doc.name, doc.employee_name


def create_personas():
	out = {}
	manager_email = None
	for key in ("REP_MAN", "EMP", "EMP2", "EMP3"):
		p = PERSONAS[key]
		email = f"e2e-{key.lower().replace('_', '-')}@example.com"
		create_user(email, p["first"], p["last"], p["roles"])
		extra = {"leave_approver": manager_email} if manager_email else {}
		if key in REPORTEES:
			extra.update(reports_to=out["REP_MAN"]["id"], custom_reporting_manager=out["REP_MAN"]["name"])
		if p.get("business_unit"):
			extra["custom_business_unit"] = p["business_unit"]
		emp_id, emp_name = create_employee(p["first"], p["last"], email, **extra)
		out[key] = {"id": emp_id, "name": emp_name, "email": email}
		if key == "REP_MAN":
			manager_email = email

	for i in range(1, FILLERS + 1):
		create_employee("Filler", f"Member{i:02d}")
	return out


def write_env(personas):
	lines = [
		"BASE_URL=http://localhost:8000",
		"ADMIN_EMAIL=Administrator",
		f"ADMIN_PASS={PASSWORD}",
	]
	for key, p in personas.items():
		lines += [f"{key}_ID={p['id']}", f"{key}_EMAIL={p['email']}", f"{key}_PASS={PASSWORD}", f"{key}_NAME={p['name']}"]
	with open(os.environ["E2E_ENV_OUT"], "w") as f:
		f.write("\n".join(lines) + "\n")
