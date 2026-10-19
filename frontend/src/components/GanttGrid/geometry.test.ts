import { describe, expect, it } from "vitest";
import {
  barDateRange,
  barDaySpan,
  barMetrics,
  buildTimeline,
  clamp,
  columnIndex,
  columnWidthFor,
  countDays,
  dateAtColumn,
  isColumnOccupied,
  rangeMetrics,
  resizeGeometry,
  snapValue,
  timelineBounds,
} from "./geometry";

// Monday
const WEEK_START = new Date(2026, 9, 19);
const day = (date: number, month = 9) => new Date(2026, month, date);

describe("columnIndex", () => {
  it("counts calendar days when weekends are shown", () => {
    expect(columnIndex(day(19), WEEK_START, true)).toBe(0);
    expect(columnIndex(day(25), WEEK_START, true)).toBe(6);
    expect(columnIndex(day(27), WEEK_START, true)).toBe(8);
    expect(columnIndex(day(18), WEEK_START, true)).toBe(-1);
  });

  it("skips weekends when they aren't shown", () => {
    expect(columnIndex(day(23), WEEK_START, false)).toBe(4);
    expect(columnIndex(day(26), WEEK_START, false)).toBe(5);
    expect(columnIndex(day(30), WEEK_START, false)).toBe(9);
    expect(columnIndex(day(16), WEEK_START, false)).toBe(-1);
    expect(columnIndex(day(12), WEEK_START, false)).toBe(-5);
  });

  it("puts a weekend start on the next Monday and a weekend end on the Friday", () => {
    // Saturday and Sunday of the first week
    expect(columnIndex(day(24), WEEK_START, false, "start")).toBe(5);
    expect(columnIndex(day(25), WEEK_START, false, "start")).toBe(5);
    expect(columnIndex(day(24), WEEK_START, false, "end")).toBe(4);
    expect(columnIndex(day(25), WEEK_START, false, "end")).toBe(4);
    // The Sunday before the range ends before its first column
    expect(columnIndex(day(18), WEEK_START, false, "end")).toBe(-1);
    expect(columnIndex(day(18), WEEK_START, false, "start")).toBe(0);
  });
});

describe("countDays", () => {
  it("counts both ends", () => {
    expect(countDays(day(19), day(19), true)).toBe(1);
    expect(countDays(day(19), day(30), true)).toBe(12);
    expect(countDays(day(19), day(30), false)).toBe(10);
  });

  it("leaves out weekend ends without weekend columns", () => {
    expect(countDays(day(17), day(25), false)).toBe(5);
    expect(countDays(day(24), day(25), false)).toBe(0);
  });
});

describe("dateAtColumn", () => {
  it("maps columns back to dates", () => {
    expect(dateAtColumn(6, WEEK_START, true)).toEqual(day(25));
    expect(dateAtColumn(5, WEEK_START, false)).toEqual(day(26));
    expect(dateAtColumn(9, WEEK_START, false)).toEqual(day(30));
  });

  it("is the inverse of columnIndex on shown days", () => {
    for (let index = 0; index < 15; index++) {
      const date = dateAtColumn(index, WEEK_START, false);
      expect(columnIndex(date, WEEK_START, false)).toBe(index);
    }
  });
});

describe("barMetrics", () => {
  it("places a span inside the range", () => {
    expect(barMetrics(2, 4, 14, 38)).toEqual({ barOffset: 76, width: 114 });
  });

  it("clips the start and trims a span cut off at the end", () => {
    expect(barMetrics(-3, 1, 14, 38)).toEqual({ barOffset: 0, width: 76 });
    expect(barMetrics(12, 20, 14, 38)).toEqual({ barOffset: 456, width: 73 });
  });

  it("is null outside the range or for an empty span", () => {
    expect(barMetrics(-5, -1, 14, 38)).toBeNull();
    expect(barMetrics(14, 16, 14, 38)).toBeNull();
    expect(barMetrics(5, 4, 14, 38)).toBeNull();
  });
});

describe("rangeMetrics", () => {
  const range = {
    weekStart: WEEK_START,
    showWeekend: false,
    columnCount: 10,
    columnWidth: 38,
  };

  it("places a date range on weekday columns", () => {
    expect(rangeMetrics(day(21), day(27), range)).toEqual({
      barOffset: 76,
      width: 190,
    });
  });

  it("doesn't show a range ending on the Sunday before the first week", () => {
    expect(rangeMetrics(day(12), day(18), range)).toBeNull();
  });

  it("doesn't reach into Monday for a range ending on a Saturday", () => {
    expect(rangeMetrics(day(19), day(24), range)).toEqual({
      barOffset: 0,
      width: 190,
    });
  });
});

describe("bar geometry", () => {
  const range = {
    weekStart: WEEK_START,
    showWeekend: true,
    columnCount: 14,
    columnWidth: 40,
    headerWidth: 240,
  };

  it("spans at least one day", () => {
    expect(barDaySpan(10, 40)).toBe(1);
    expect(barDaySpan(118, 40)).toBe(3);
  });

  it("reads the dates from a bar's left and width", () => {
    expect(barDateRange({ left: 320, width: 120 }, range)).toEqual({
      startDate: day(21),
      endDate: day(23),
    });
  });

  it("keeps the dates within the range", () => {
    expect(barDateRange({ left: 200, width: 800 }, range)).toEqual({
      startDate: day(19),
      endDate: day(1, 10),
    });
  });

  it("bounds bars by the day columns", () => {
    expect(timelineBounds(range)).toEqual({ minLeft: 240, maxRight: 800 });
  });

  it("finds the columns a bar covers", () => {
    const bars = [{ barOffset: 80, width: 77 }];
    expect(isColumnOccupied(bars, 1, 40)).toBe(false);
    expect(isColumnOccupied(bars, 2, 40)).toBe(true);
    expect(isColumnOccupied(bars, 3, 40)).toBe(true);
    expect(isColumnOccupied(bars, 4, 40)).toBe(false);
  });
});

describe("clamp and snapValue", () => {
  it("clamps, preferring the minimum when the bounds cross", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
    expect(clamp(5, 8, 2)).toBe(8);
  });

  it("snaps to steps from an origin", () => {
    expect(snapValue(59, 38)).toBe(76);
    expect(snapValue(300, 40, 240)).toBe(320);
    expect(snapValue(7, 0)).toBe(7);
  });
});

describe("columnWidthFor", () => {
  it("stretches columns for four weeks or fewer", () => {
    expect(columnWidthFor(1, 7, 240, 1240)).toBe(142);
    expect(columnWidthFor(4, 5, 240, 1240)).toBe(50);
  });

  it("never goes below the fixed width", () => {
    expect(columnWidthFor(2, 7, 240, 400)).toBe(38);
    expect(columnWidthFor(1, 7, 240, 0)).toBe(38);
  });

  it("keeps the fixed width for longer ranges", () => {
    expect(columnWidthFor(13, 7, 240, 10000)).toBe(38);
  });
});

describe("buildTimeline", () => {
  it("starts on the Monday and labels each week", () => {
    const timeline = buildTimeline({
      startDate: day(28, 8),
      weekCount: 2,
      showWeekend: true,
      headerWidth: 240,
      containerWidth: 0,
      today: day(30, 8),
    });
    expect(timeline.weekStart).toEqual(day(28, 8));
    expect(timeline.columnCount).toBe(14);
    expect(timeline.weeks.map((week) => week.label)).toEqual([
      "Sep 28 - Oct 4",
      "Oct 5 - 11",
    ]);
    expect(timeline.weekendColumns).toEqual([5, 6, 12, 13]);
    expect(timeline.weeks[0].days[2].isToday).toBe(true);
    expect(timeline.weeks[0].days[5]).toMatchObject({
      isWeekend: true,
      isWeekendStart: true,
      isWeekendEnd: false,
    });
    expect(timeline.weeks[0].days[6]).toMatchObject({
      isWeekendStart: false,
      isWeekendEnd: true,
    });
  });

  it("drops the weekend columns when they aren't shown", () => {
    const timeline = buildTimeline({
      startDate: day(21),
      weekCount: 1,
      showWeekend: false,
      headerWidth: 240,
      containerWidth: 0,
    });
    expect(timeline.daysPerWeek).toBe(5);
    expect(timeline.weeks[0].label).toBe("Oct 19 - 23");
    expect(timeline.weeks[0].days.map((d) => d.date.getDate())).toEqual([
      19, 20, 21, 22, 23,
    ]);
    expect(timeline.weekendColumns).toEqual([]);
  });
});

describe("resizeGeometry", () => {
  const base = {
    origin: { left: 320, width: 120 },
    unit: 40,
    minLeft: 240,
    maxRight: 800,
  };

  it("moves the end edge and keeps the start", () => {
    expect(resizeGeometry({ ...base, edge: "end", deltaX: 55 })).toEqual({
      left: 320,
      width: 175,
    });
    expect(
      resizeGeometry({ ...base, edge: "end", deltaX: 55, snap: true }),
    ).toEqual({ left: 320, width: 160 });
  });

  it("moves the start edge and keeps the end", () => {
    expect(resizeGeometry({ ...base, edge: "start", deltaX: -50 })).toEqual({
      left: 270,
      width: 170,
    });
    expect(
      resizeGeometry({ ...base, edge: "start", deltaX: -50, snap: true }),
    ).toEqual({ left: 280, width: 160 });
  });

  it("keeps at least one day", () => {
    expect(resizeGeometry({ ...base, edge: "end", deltaX: -500 })).toEqual({
      left: 320,
      width: 40,
    });
    expect(resizeGeometry({ ...base, edge: "start", deltaX: 500 })).toEqual({
      left: 400,
      width: 40,
    });
  });

  it("stays within the day columns", () => {
    expect(resizeGeometry({ ...base, edge: "end", deltaX: 900 })).toEqual({
      left: 320,
      width: 480,
    });
    expect(resizeGeometry({ ...base, edge: "start", deltaX: -900 })).toEqual({
      left: 240,
      width: 200,
    });
  });
});
