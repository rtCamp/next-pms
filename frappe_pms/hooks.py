app_name = "frappe_pms"
app_title = "Frappe PMS"
app_publisher = "rtCamp"
app_description = "Simplified Project Management System"
app_email = "erp@rtcamp.com"
app_license = "AGPLv3"
# required_apps = []

# Includes in <head>
# ------------------

website_route_rules = [
    {
        "from_route": "/timesheet/<path:app_path>",
        "to_route": "/timesheet",
    },
]

# include js, css files in header of desk.html
# app_include_css = "/assets/frappe_pms/css/frappe_pms.css"
# app_include_js = "/assets/frappe_pms/js/frappe_pms.js"

# include js, css files in header of web template
# web_include_css = "/assets/frappe_pms/css/frappe_pms.css"
# web_include_js = "/assets/frappe_pms/js/frappe_pms.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "frappe_pms/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {
    "Timesheet": "public/js/timesheet.js",
    "Employee": "public/js/employee.js",
    "Project": "public/js/project.js",
}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "frappe_pms/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "frappe_pms.utils.jinja_methods",
# 	"filters": "frappe_pms.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "frappe_pms.install.before_install"
# after_install = "frappe_pms.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "frappe_pms.uninstall.before_uninstall"
# after_uninstall = "frappe_pms.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "frappe_pms.utils.before_app_install"
# after_app_install = "frappe_pms.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "frappe_pms.utils.before_app_uninstall"
# after_app_uninstall = "frappe_pms.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "frappe_pms.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }


fixtures = [
    {
        "dt": "Property Setter",
        "filters": [
            [
                "module",
                "in",
                ["Project Currency", "Timesheet"],
            ]
        ],
    },
    {
        "dt": "Custom Field",
        "filters": [
            [
                "module",
                "in",
                ["Project Currency", "Timesheet"],
            ]
        ],
    },
]


# DocType Class
# ---------------
# Override standard doctype classes

override_doctype_class = {
    "Project": "frappe_pms.project_currency.overrides.project.ProjectOverwrite",
    "Customize Form": "frappe_pms.project_currency.overrides.customize_form.CustomizeFormOverride",
    "Timesheet": "frappe_pms.project_currency.overrides.timesheet.TimesheetOverwrite",
    "Task": "frappe_pms.project_currency.overrides.task.TaskOverride",
}


# Scheduled Tasks
# ---------------

scheduler_events = {
    "daily_long": [
        "frappe_pms.timesheet.tasks.daily_reminder_for_time_entry.send_reminder",
        "frappe_pms.timesheet.tasks.send_weekly_reminder.send_reminder",
        "frappe_pms.project_currency.tasks.reminde_project_threshold.send_reminder_mail",
    ],
}

# Testing
# -------

# before_tests = "frappe_pms.install.before_tests"

after_install = "frappe_pms.install.after_install"


# Overriding Methods
# ------------------------------
#
override_whitelisted_methods = {
    "erpnext.projects.doctype.project.project.recalculate_project_total_purchase_cost": "frappe_pms.project_currency.overrides.project.recalculate_project_total_purchase_cost"
}

doc_events = {
    "Timesheet": {
        "validate": "frappe_pms.timesheet.doc_events.timesheet.validate",
        "before_save": "frappe_pms.timesheet.doc_events.timesheet.before_save",
        "before_insert": "frappe_pms.timesheet.doc_events.timesheet.before_insert",
        "on_update": "frappe_pms.timesheet.doc_events.timesheet.on_update",
    },
    "Task": {
        "after_insert": "frappe_pms.project_currency.doc_events.task.after_insert"
    },
    "Project": {
        "on_update": "frappe_pms.project_currency.doc_events.project.on_update",
        "onload": "frappe_pms.project_currency.doc_events.project.onload",
    },
}
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "frappe_pms.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["frappe_pms.utils.before_request"]
# after_request = ["frappe_pms.utils.after_request"]

# Job Events
# ----------
# before_job = ["frappe_pms.utils.before_job"]
# after_job = ["frappe_pms.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"frappe_pms.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }
