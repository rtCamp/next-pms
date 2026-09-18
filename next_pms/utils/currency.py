import frappe
from erpnext.setup.utils import get_exchange_rate
from frappe import _


def require_exchange_rate(from_currency: str, to_currency: str, transaction_date=None) -> float:
    """Exchange rate that fails loudly instead of falling back silently.

    erpnext's ``get_exchange_rate`` returns 0.0 (logging an error the caller
    never sees) when no Currency Exchange record exists and the rate service
    fails. Multiplying by ``rate or 1`` at call sites treated unconverted
    amounts as already converted (e.g. INR stored as USD, ~85x off). A missing
    rate must abort the operation so the gap gets fixed at the source.
    """
    if not from_currency or not to_currency:
        frappe.throw(_("Both currencies are required for conversion."), title=_("Missing Exchange Rate"))
    if from_currency == to_currency:
        return 1.0
    rate = get_exchange_rate(from_currency, to_currency, transaction_date)
    if not rate:
        frappe.throw(
            _(
                "No exchange rate found from {0} to {1}{2}. Create a Currency Exchange record "
                "or enable the currency exchange rate service."
            ).format(
                from_currency,
                to_currency,
                _(" as at {0}").format(transaction_date) if transaction_date else "",
            ),
            title=_("Missing Exchange Rate"),
        )
    return rate
