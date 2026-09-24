import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildChartSeries, resolveChartRange } from "./analytics-charts";

const day = (d: number, h = 12) => new Date(2026, 8, d, h); // September 2026, local time

describe("buildChartSeries", () => {
  const range = { startDate: day(1, 0), endDate: day(3, 23), useDaily: true };
  const orders = [
    { createdAt: day(1), total: 1000, status: "SHIPPED" },
    { createdAt: day(1, 18), total: 500, status: "CANCELLED" },
    { createdAt: day(3), total: 700, status: "PENDING" },
  ];

  it("has one point per day, zero-filled", () => {
    const { revenue } = buildChartSeries(orders, range);
    assert.deepEqual(revenue.map((r) => r.date), ["1/9", "2/9", "3/9"]);
  });

  it("excludes cancelled orders from revenue but counts them as orders", () => {
    const { revenue, orders: counts } = buildChartSeries(orders, range);
    assert.deepEqual(revenue.map((r) => r.revenue), [1000, 0, 700]);
    assert.deepEqual(counts.map((r) => r.orders), [2, 0, 1]);
  });

  it("breaks each day down by status", () => {
    const { statusOverTime } = buildChartSeries(orders, range);
    assert.equal(statusOverTime[0].SHIPPED, 1);
    assert.equal(statusOverTime[0].CANCELLED, 1);
    assert.equal(statusOverTime[1].PENDING, 0);
    assert.equal(statusOverTime[2].PENDING, 1);
  });

  it("groups by month for long ranges", () => {
    const monthly = { startDate: new Date(2026, 6, 1), endDate: new Date(2026, 8, 30), useDaily: false };
    const { orders: counts } = buildChartSeries(orders, monthly);
    assert.equal(counts.length, 3);
    assert.deepEqual(counts.map((c) => c.orders), [0, 0, 3]);
  });
});

describe("resolveChartRange", () => {
  it("uses daily points for ranges of 31 days or fewer, monthly otherwise", () => {
    const now = new Date(2026, 8, 30);
    assert.equal(resolveChartRange("daily", { start: day(1, 0), end: day(30, 23) }, now).useDaily, true);
    assert.equal(
      resolveChartRange("daily", { start: new Date(2026, 0, 1), end: day(30, 23) }, now).useDaily,
      false
    );
  });
});
