from frappe.utils import flt

from next_pms.utils.employee import get_income_tax_slab, get_salary_breakdown

CONVERSION_CURRENCIES = ("USD", "INR")


class EmployeeOverride:
    @property
    def custom_monthly_salary(self) -> float | None:
        return self._get_salary_amount("custom_monthly_salary")

    @property
    def custom_hourly_salary(self) -> float | None:
        return self._get_salary_amount("custom_hourly_salary")

    @property
    def custom_income_tax_slab(self) -> str | None:
        return self._salary_information.get("income_tax_slab")

    @property
    def custom_annual_salary_usd(self) -> float | None:
        return self._get_salary_amount("custom_annual_salary_usd")

    @property
    def custom_monthly_salary_usd(self) -> float | None:
        return self._get_salary_amount("custom_monthly_salary_usd")

    @property
    def custom_hourly_salary_usd(self) -> float | None:
        return self._get_salary_amount("custom_hourly_salary_usd")

    @property
    def custom_annual_salary_inr(self) -> float | None:
        return self._get_salary_amount("custom_annual_salary_inr")

    @property
    def custom_monthly_salary_inr(self) -> float | None:
        return self._get_salary_amount("custom_monthly_salary_inr")

    @property
    def custom_hourly_salary_inr(self) -> float | None:
        return self._get_salary_amount("custom_hourly_salary_inr")

    @property
    def custom_usd_currency(self) -> str:
        return "USD"

    @property
    def custom_inr_currency(self) -> str:
        return "INR"

    @property
    def _salary_information(self) -> dict:
        inputs = (self.name, self.ctc, self.salary_currency, self.custom_working_hours, self.custom_work_schedule)
        cached = self.__dict__.get("_salary_information_cache")
        if not cached or cached[0] != inputs:
            cached = (inputs, self._get_salary_information())
            self.__dict__["_salary_information_cache"] = cached
        return cached[1]

    def _get_salary_amount(self, fieldname: str) -> float | None:
        amount = self._salary_information.get(fieldname.removeprefix("custom_"))
        return None if amount is None else flt(amount, self.precision(fieldname))

    def _get_salary_information(self) -> dict:
        if not self.ctc or not self.salary_currency:
            return {}

        row = {
            "name": self.name,
            "ctc": self.ctc,
            "salary_currency": self.salary_currency,
            "custom_working_hours": self.custom_working_hours,
            "custom_work_schedule": self.custom_work_schedule,
        }
        information = {**get_salary_breakdown([row])[self.name], "income_tax_slab": get_income_tax_slab(self.name)}
        for currency in CONVERSION_CURRENCIES:
            converted = get_salary_breakdown([row], currency)[self.name]
            information[f"annual_salary_{currency.lower()}"] = converted["monthly_salary"] * 12
            information[f"monthly_salary_{currency.lower()}"] = converted["monthly_salary"]
            information[f"hourly_salary_{currency.lower()}"] = converted["hourly_salary"]
        return information

    def remove_unpicklable_values(self, state: dict) -> None:
        super().remove_unpicklable_values(state)
        state.pop("_salary_information_cache", None)
