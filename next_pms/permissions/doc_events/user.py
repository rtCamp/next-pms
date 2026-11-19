from next_pms.permissions.capabilities import get_implied_roles


def validate(doc, method=None):
    held = {row.role for row in doc.roles}
    for role in sorted(get_implied_roles(held) - held):
        doc.append("roles", {"role": role})
