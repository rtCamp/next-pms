from datetime import datetime, timedelta
from typing import Any


def transform_google_events(events: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Transform Google Calendar API events to the desired Event structure.

    Args:
        events (dict): Google Calendar API events response

    Returns:
        List[Dict[str, Any]]: Transformed events in the new Event structure
    """
    transformed_events = []

    for event in events.get("items", []):
        start = event.get("start", {})
        end = event.get("end", {})

        starts_on = datetime.fromisoformat(start.get("dateTime", start.get("date"))) if start else None
        ends_on = datetime.fromisoformat(end.get("dateTime", end.get("date"))) if end else None

        if starts_on and isinstance(starts_on, datetime):
            if starts_on.hour == 0 and starts_on.minute == 0:
                starts_on = starts_on.date()

        if ends_on and isinstance(ends_on, datetime):
            if ends_on.hour == 0 and ends_on.minute == 0:
                ends_on = ends_on.date()

        # Determine if it's an all-day event
        all_day = 0
        if starts_on and ends_on:
            start_date = starts_on.date() if isinstance(starts_on, datetime) else starts_on
            end_date = ends_on.date() if isinstance(ends_on, datetime) else ends_on

            # Check if the difference between start and end is exactly 24 hours
            # or if the end date is one day after the start date
            if (
                isinstance(starts_on, datetime)
                and isinstance(ends_on, datetime)
                and (ends_on - starts_on == timedelta(days=1))
                or (end_date - start_date == timedelta(days=1))
            ):
                all_day = 1

        transformed_event = {
            "id": event.get("id", ""),
            "subject": event.get("summary", ""),
            "starts_on": starts_on,
            "ends_on": ends_on,
            "selected": False,
            "description": event.get("description", ""),
            "color": event.get("colorId"),
            "owner": event.get("creator", {}).get("email"),
            "all_day": all_day,
            "event_type": event.get("eventType"),
            "repeat_this_event": 1 if "recurringEventId" in event else 0,
            "repeat_on": None,
            "repeat_till": None,
        }

        transformed_events.append(transformed_event)

    return transformed_events
