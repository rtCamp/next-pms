def validate(doc, method):
    from next_pms.timesheet.api.utils import get_holidays

    get_holidays.clear_cache()
