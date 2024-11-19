# import frappe
# from frappe.query_builder import Case


# def get_allocation_list_for_employee_for_given_range(employee_names: list, start_date, end_date):

#     resource_allocation = frappe.qb.DocType("Resource Allocation")

#     employee_names = ", ".join(employee_names)

#     query = f"""
#         SELECT allocation_start_date, allocation_end_date
#             FROM `tabResource Allocation`
#             WHERE employee IN ({employee_names})
#             AND (
#                 (allocation_start_date <= "{start_date}" AND allocation_end_date <= "{start_date})
#                 OR (allocation_start_date >= "{start_date}" AND allocation_end_date <= "{end_date}")
#                 OR (allocation_start_date <= "{end_date}" AND allocation_end_date >= "{end_date}")
#                 OR (allocation_start_date <= "{start_date}" AND allocation_end_date >= "{end_date}")
#             )
#             ORDER BY allocation_start_date, allocation_end_date;
#         """

#     allocation_list = frappe.db.sql(query, as_dict=True)

#     print(allocation_list)

#     # case = Case.any(
#     #     [
#     #         resource_allocation.allocation_start_date
#     #         <= start_date & resource_allocation.allocation_end_date
#     #         >= start_date
#     #     ],
#     #     [
#     #         resource_allocation.allocation_start_date
#     #         <= start_date & resource_allocation.allocation_end_date
#     #         >= start_date
#     #     ],
#     # )

#     # q = (
#     #     frappe.qb.from_(resource_allocation)
#     #     .select(
#     #         # resource_allocation.name,
#     #         # resource_allocation.employee,
#     #         resource_allocation.allocation_start_date,
#     #         resource_allocation.allocation_end_date,
#     #         # resource_allocation.hours_allocated_per_day,
#     #         # resource_allocation.project,
#     #         # resource_allocation.project_name,
#     #         # resource_allocation.customer,
#     #         # resource_allocation.is_billable,
#     #     )
#     #     .where(resource_allocation.employee.isin(employee_names))
#     #     .where(
#     #         case
#     #         # (
#     #         #     resource_allocation.allocation_start_date
#     #         #     <= start_date & resource_allocation.allocation_end_date
#     #         #     >= start_date
#     #         # )
#     #         # | (
#     #         #     resource_allocation.allocation_start_date
#     #         #     >= start_date & resource_allocation.allocation_end_date
#     #         #     <= end_date
#     #         # )
#     #         # | (
#     #         #     resource_allocation.allocation_start_date
#     #         #     <= end_date & resource_allocation.allocation_end_date
#     #         #     >= end_date
#     #         # )
#     #         # | (
#     #         #     resource_allocation.allocation_start_date
#     #         #     <= start_date & resource_allocation.allocation_end_date
#     #         #     >= end_date
#     #         # )
#     #     )
#     #     .orderby(resource_allocation.allocation_start_date, resource_allocation.allocation_end_date)
#     # )
#     # resource_allocations = q.run(as_dict=True)

#     # print(resource_allocations)
