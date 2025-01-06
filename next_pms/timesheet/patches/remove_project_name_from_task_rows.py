import frappe
import json
from frappe.utils import update_progress_bar

def execute():
    settings_docs = frappe.get_all('PMS View Setting', fields=['name', 'dt', 'rows'])
    length = len(settings_docs)
    for i,doc in enumerate(settings_docs):
        update_progress_bar("Removing project_name from PMS View Setting", i, length)
        if doc.dt == "Task":
            if doc.rows:
                try:
                    rows_data = json.loads(doc.rows)
                    project_name = "project_name"                   
                    if project_name in rows_data:
                        rows_data.remove(project_name)
                        frappe.db.set_value('PMS View Setting', doc.name, 'rows', json.dumps(rows_data))
                        frappe.db.commit() 
                except json.JSONDecodeError:
                    frappe.log_error(f"Invalid JSON format in rows field for document {doc.name}")