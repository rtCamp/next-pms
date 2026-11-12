from next_pms.install import add_tech_stack_to_crm_deal_layout
from next_pms.setup import install_custom_fields


def execute():
    install_custom_fields()
    add_tech_stack_to_crm_deal_layout()
