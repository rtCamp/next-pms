app_name = "timesheet_enhancer"
app_title = "Timesheet Enhancer"
app_publisher = "rtCamp"
app_description = "Frappe app for Timesheet enhancements"
app_email = "sys@rtcamp.com"
app_license = "mit"
# required_apps = []

website_route_rules = [
    {
        "from_route": "/timesheet/<path:app_path>",
        "to_route": "/timesheet",
    },
]
# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/timesheet_enhancer/css/timesheet_enhancer.css"
# app_include_js = "/assets/timesheet_enhancer/js/timesheet_enhancer.js"

# include js, css files in header of web template
# web_include_css = "/assets/timesheet_enhancer/css/timesheet_enhancer.css"
# web_include_js = "/assets/timesheet_enhancer/js/timesheet_enhancer.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "timesheet_enhancer/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {"Timesheet": "public/js/timesheet.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "timesheet_enhancer/public/icons.svg"

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
# 	"methods": "timesheet_enhancer.utils.jinja_methods",
# 	"filters": "timesheet_enhancer.utils.jinja_filters"
# }
fixtures = [
    {
        "dt": "Custom Field",
        "filters": [
            [
                "name",
                "in",
                {
                    "Task-custom_is_billable",
                    "Project Type-custom_is_billable",
                    "Timesheet-custom_approval_status",
                },
            ]
        ],
    },
    {
        "dt": "Property Setter",
        "filters": [
            [
                "name",
                "in",
                {
                    "Task-total_billing_amount-permlevel",
                    "Task-total_expense_claim-permlevel",
                    "Task-total_costing_amount-permlevel",
                },
            ]
        ],
    },
]
# Installation
# ------------

# before_install = "timesheet_enhancer.install.before_install"
# after_install = "timesheet_enhancer.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "timesheet_enhancer.uninstall.before_uninstall"
# after_uninstall = "timesheet_enhancer.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "timesheet_enhancer.utils.before_app_install"
# after_app_install = "timesheet_enhancer.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "timesheet_enhancer.utils.before_app_uninstall"
# after_app_uninstall = "timesheet_enhancer.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "timesheet_enhancer.notifications.get_notification_config"

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

# DocType Class
# ---------------
# Override standard doctype classes

override_doctype_class = {
    "Timesheet": "timesheet_enhancer.overrides.timesheet_override.TimesheetOverride",
}

# Document Events
# ---------------
# Hook on document methods and events

doc_events = {
    "Timesheet": {
        "validate": "timesheet_enhancer.doc_events.timesheet.validate",
        "before_save": "timesheet_enhancer.doc_events.timesheet.before_save",
    }
}

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"timesheet_enhancer.tasks.all"
# 	],
# 	"daily": [
# 		"timesheet_enhancer.tasks.daily"
# 	],
# 	"hourly": [
# 		"timesheet_enhancer.tasks.hourly"
# 	],
# 	"weekly": [
# 		"timesheet_enhancer.tasks.weekly"
# 	],
# 	"monthly": [
# 		"timesheet_enhancer.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "timesheet_enhancer.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "timesheet_enhancer.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "timesheet_enhancer.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["timesheet_enhancer.utils.before_request"]
# after_request = ["timesheet_enhancer.utils.after_request"]

# Job Events
# ----------
# before_job = ["timesheet_enhancer.utils.before_job"]
# after_job = ["timesheet_enhancer.utils.after_job"]

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
# 	"timesheet_enhancer.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }
