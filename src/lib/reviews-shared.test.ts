import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildSocialProofSettings,
  pickReviewsForProduct,
  reviewAltText,
  type Review,
} from "./reviews-shared";

function review(id: string, overrides: Partial<Review> = {}): Review {
  return {
    id,
    image: `/reviews/${id}.jpg`,
    width: 720,
    height: 1600,
    caption: "",
    customerName: "",
    source: "MESSENGER",
    isFeatured: false,
    productIds: [],
    ...overrides,
  };
}

describe("pickReviewsForProduct", () => {
  const all = [
    review("a", { isFeatured: true }),
    review("b", { productIds: ["p1"] }),
    review("c", { isFeatured: true, productIds: ["p1"] }),
    review("d", { isFeatured: true }),
    review("e"),
  ];

  it("puts screenshots tagged with the product first, then featured general ones", () => {
    assert.deepEqual(pickReviewsForProduct(all, "p1", 10).map((r) => r.id), ["b", "c", "a", "d"]);
  });

  it("never lists a screenshot twice and respects the limit", () => {
    assert.deepEqual(pickReviewsForProduct(all, "p1", 3).map((r) => r.id), ["b", "c", "a"]);
  });

  it("falls back to featured screenshots for an untagged product", () => {
    assert.deepEqual(pickReviewsForProduct(all, "other", 10).map((r) => r.id), ["a", "c", "d"]);
  });
});

describe("buildSocialProofSettings", () => {
  it("reads counts and switches from the settings map", () => {
    assert.deepEqual(
      buildSocialProofSettings({
        reviewsCustomerCount: " 12,000+ ",
        reviewsOrdersDelivered: "9,000+",
        reviewsHomeEnabled: "false",
        reviewsProductTabEnabled: "true",
        reviewsTrustLineEnabled: "false",
      }),
      {
        customerCount: "12,000+",
        ordersDelivered: "9,000+",
        homeEnabled: false,
        productTabEnabled: true,
        trustLineEnabled: false,
      }
    );
  });

  it("uses the defaults when keys are missing or blank", () => {
    assert.deepEqual(buildSocialProofSettings({ reviewsCustomerCount: "  " }), {
      customerCount: "10,000+",
      ordersDelivered: "8,800+",
      homeEnabled: true,
      productTabEnabled: true,
      trustLineEnabled: true,
    });
  });
});

describe("reviewAltText", () => {
  it("describes a chat screenshot with the customer name and caption", () => {
    assert.equal(
      reviewAltText(review("x", { source: "INSTAGRAM", customerName: "Alif", caption: "Great product." })),
      "Instagram message from Alif: Great product."
    );
  });

  it("falls back to a generic description when name and caption are empty", () => {
    assert.equal(reviewAltText(review("x", { source: "PHOTO" })), "Customer photo from a customer");
  });
});
