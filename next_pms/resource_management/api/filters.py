"""API endpoints for filter options used in resource management module."""

import frappe
from frappe import whitelist

from next_pms.resource_management.api.utils.helpers import resource_api_permissions_check


@whitelist()
def get_designations():
	"""
	Get list of enabled designations for filter options.
	
	Returns:
		list: List of designation names with custom_enabled = True
	"""
	# Check user permissions
	permissions = resource_api_permissions_check()
	
	if not permissions.get("read"):
		frappe.throw(
			frappe._("You don't have permission to access designations"),
			frappe.PermissionError,
		)
	
	try:
		designations = frappe.get_list(
			"Designation",
			filters={"custom_enabled": True},
			fields=["name"],
			order_by="name asc",
			ignore_permissions=False  # Respect user's actual permissions
		)
		return designations
	except frappe.PermissionError:
		# If user doesn't have permissions on Designation doctype,
		# return empty list instead of throwing error
		frappe.log_error(
			f"User {frappe.session.user} attempted to fetch designations without proper permissions"
		)
		return []


@whitelist()
def get_business_units():
	"""
	Get list of business units for filter options.
	
	Returns:
		list: List of business unit names
	"""
	# Check user permissions
	permissions = resource_api_permissions_check()
	
	if not permissions.get("read"):
		frappe.throw(
			frappe._("You don't have permission to access business units"),
			frappe.PermissionError,
		)
	
	try:
		business_units = frappe.get_list(
			"Business Unit",
			fields=["name"],
			order_by="name asc",
			ignore_permissions=False  # Respect user's actual permissions
		)
		return business_units
	except frappe.PermissionError:
		# If user doesn't have permissions on Business Unit doctype,
		# return empty list instead of throwing error
		frappe.log_error(
			f"User {frappe.session.user} attempted to fetch business units without proper permissions"
		)
		return []
