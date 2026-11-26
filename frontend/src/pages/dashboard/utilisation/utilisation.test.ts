import { describe, expect, it } from "vitest";
import {
  donutArcs,
  utilisationSegments,
  type TimeUtilisationRole,
} from "./utilisation";

const role = (billable: number, nonBillable: number): TimeUtilisationRole => ({
  designation: "Engineer",
  billable_hours: billable,
  non_billable_hours: nonBillable,
});
const values = (roles: TimeUtilisationRole[]) =>
  utilisationSegments(roles).map((segment) => segment.value);

describe("utilisationSegments", () => {
  it("sums the roles' hours, billable first", () => {
    expect(values([role(3, 1), role(3, 3)])).toEqual([60, 40]);
  });

  it("gives non-billable the rest, so the shares add up to 100", () => {
    // 12.5% / 87.5%: rounding both would give 13 + 88.
    expect(values([role(1, 7)])).toEqual([13, 87]);
  });

  it("is 0 / 0 with no hours", () => {
    expect(values([])).toEqual([0, 0]);
    expect(values([role(0, 0)])).toEqual([0, 0]);
  });
});

describe("donutArcs", () => {
  const segments = (billable: number, nonBillable: number) =>
    utilisationSegments([role(billable, nonBillable)]);

  it("draws one arc per segment", () => {
    expect(donutArcs(segments(1, 1)).map((arc) => arc.key)).toEqual([
      "billable",
      "non_billable",
    ]);
  });

  it("draws nothing with no hours", () => {
    expect(donutArcs(segments(0, 0))).toEqual([]);
  });

  it("draws a single large arc at 100%, leaving the gap at the top", () => {
    const arcs = donutArcs(segments(0, 5));
    expect(arcs.map((arc) => arc.key)).toEqual(["non_billable"]);
    // Large-arc flag set: the sector spans 356°.
    expect(arcs[0].d).toMatch(/A 65 65 0 1 1/);
  });

  it("leaves out a segment too small to show past the gap", () => {
    // 1% is 3.6°, under the 4° gap.
    expect(donutArcs(segments(1, 99)).map((arc) => arc.key)).toEqual([
      "non_billable",
    ]);
  });
});
