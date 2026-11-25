from next_pms.permissions.docperms import apply_doctype_permissions


def execute() -> None:
    apply_doctype_permissions("Employee")
