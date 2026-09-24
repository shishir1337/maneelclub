import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { countPurchasesByCustomer, statusCountsFromGroups } from "./admin-order-stats";

describe("countPurchasesByCustomer", () => {
  // Same rule as the old per-row query: orders WHERE customerPhone = phone OR customerEmail = email.
  const history = [
    { customerPhone: "017", customerEmail: "a@x.com" },
    { customerPhone: "017", customerEmail: null },
    { customerPhone: "018", customerEmail: "a@x.com" }, // same email, different phone
    { customerPhone: "019", customerEmail: "b@x.com" },
  ];

  it("counts orders sharing the phone or the email, without double counting", () => {
    assert.deepEqual(
      countPurchasesByCustomer(
        [
          { id: "o1", customerPhone: "017", customerEmail: "a@x.com" },
          { id: "o2", customerPhone: "019", customerEmail: null },
          { id: "o3", customerPhone: "020", customerEmail: null },
        ],
        history
      ),
      { o1: 3, o2: 1, o3: 0 }
    );
  });

  it("does not match on an empty email", () => {
    assert.deepEqual(
      countPurchasesByCustomer([{ id: "o", customerPhone: "999", customerEmail: null }], [
        { customerPhone: "111", customerEmail: null },
      ]),
      { o: 0 }
    );
  });
});

describe("statusCountsFromGroups", () => {
  it("fills every status, including ones with no orders, and totals them", () => {
    assert.deepEqual(
      statusCountsFromGroups([
        { status: "SHIPPED", _count: { _all: 5 } },
        { status: "CANCELLED", _count: { _all: 2 } },
      ]),
      { all: 7, PENDING: 0, CONFIRMED: 0, PROCESSING: 0, SHIPPED: 5, DELIVERED: 0, CANCELLED: 2 }
    );
  });
});
