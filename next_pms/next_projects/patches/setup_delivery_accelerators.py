from next_pms.install import create_default_delivery_accelerators, setup_project_delivery_accelerators_field


def execute():
    create_default_delivery_accelerators()
    setup_project_delivery_accelerators_field()
