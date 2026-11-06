import { describe, expect, it } from "vitest";
import {
  capacityHoursPerDay,
  capacityLabel,
  hourlyRateLabel,
} from "./capacity";

describe("capacityHoursPerDay", () => {
  it("reads daily hours and divides weekly ones by five", () => {
    expect(
      capacityHoursPerDay({
        custom_working_hours: 8,
        custom_work_schedule: "Per Day",
      }),
    ).toBe(8);
    expect(
      capacityHoursPerDay({
        custom_working_hours: 37,
        custom_work_schedule: "Per Week",
      }),
    ).toBe(7.4);
  });

  it("is undefined without hours", () => {
    expect(capacityHoursPerDay({ custom_working_hours: 0 })).toBeUndefined();
  });
});

describe("capacityLabel", () => {
  it("shows a week of hours", () => {
    expect(capacityLabel({ custom_working_hours: 8 })).toBe("40h/week");
    expect(
      capacityLabel({
        custom_working_hours: 30,
        custom_work_schedule: "Per Week",
      }),
    ).toBe("30h/week");
    expect(capacityLabel({})).toBe("");
  });
});

describe("hourlyRateLabel", () => {
  it("spreads the yearly CTC over four weeks a month", () => {
    expect(
      hourlyRateLabel({
        ctc: 192000,
        custom_working_hours: 8,
        custom_work_schedule: "Per Day",
        salary_currency: "USD",
      }),
    ).toBe("$100.00/hour");
  });

  it("assumes 40 hours a week and is empty without a CTC", () => {
    expect(hourlyRateLabel({ ctc: "96000", salary_currency: "USD" })).toBe(
      "$50.00/hour",
    );
    expect(hourlyRateLabel({ ctc: null })).toBe("");
  });
});
