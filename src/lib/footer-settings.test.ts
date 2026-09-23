import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SETTINGS,
  DEFAULT_FOOTER_COLUMNS,
  DEFAULT_FOOTER_BOTTOM_LINKS,
  buildFooterSettings,
} from "./settings-defaults";

const defaults: Record<string, string> = { ...DEFAULT_SETTINGS };
const options = { whatsappNumber: "+8801997193518", fallbackStoreName: "Fallback Store" };

describe("buildFooterSettings", () => {
  it("reproduces today's footer content from the default settings", () => {
    const footer = buildFooterSettings(defaults, options);
    assert.equal(footer.storeName, "Maneel Club");
    assert.equal(footer.tagline, "Premium clothing brand in Bangladesh. Quality fashion at affordable prices.");
    assert.equal(footer.facebookUrl, "https://www.facebook.com/maneelclub");
    assert.equal(footer.instagramUrl, "");
    assert.equal(footer.whatsappNumber, "+8801997193518");
    assert.equal(footer.email, "support@maneelclub.com");
    assert.equal(footer.phone, "+8801997193518");
    assert.deepEqual(footer.address, [
      "Block #A, Muntaha Tower (Grand Floor)",
      "Behind Al Baraka Hospital, Model Town",
      "Keraniganj, Dhaka- 1310",
    ]);
    assert.equal(footer.mapUrl, "https://maps.app.goo.gl/eva1uWFvVgVcTaKC9");
    assert.deepEqual(footer.columns, DEFAULT_FOOTER_COLUMNS);
    assert.deepEqual(footer.bottomLinks, DEFAULT_FOOTER_BOTTOM_LINKS);
  });

  it("falls back to the given store name only when the setting is blank", () => {
    assert.equal(buildFooterSettings({ ...defaults, storeName: "  " }, options).storeName, "Fallback Store");
    assert.equal(buildFooterSettings({ ...defaults, storeName: " Maneel " }, options).storeName, "Maneel");
  });

  it("trims text fields and treats blanks as hidden", () => {
    const footer = buildFooterSettings(
      { ...defaults, footerTagline: "  ", facebookUrl: " ", storeEmail: "", storePhone: "  ", footerMapUrl: " " },
      { ...options, whatsappNumber: "  " }
    );
    assert.equal(footer.tagline, "");
    assert.equal(footer.facebookUrl, "");
    assert.equal(footer.email, "");
    assert.equal(footer.phone, "");
    assert.equal(footer.mapUrl, "");
    assert.equal(footer.whatsappNumber, "");
  });

  it("splits the address on any newline style and drops blank lines", () => {
    const footer = buildFooterSettings(
      { ...defaults, footerAddress: " Line one \r\n\n  Line two  \n   " },
      options
    );
    assert.deepEqual(footer.address, ["Line one", "Line two"]);
  });

  it("respects a deliberately emptied column or bottom-link list", () => {
    const footer = buildFooterSettings(
      { ...defaults, footerColumns: "[]", footerBottomLinks: "[]" },
      options
    );
    assert.deepEqual(footer.columns, []);
    assert.deepEqual(footer.bottomLinks, []);
  });

  it("falls back to default columns and bottom links when the stored JSON is broken", () => {
    const footer = buildFooterSettings(
      { ...defaults, footerColumns: "{broken", footerBottomLinks: "nope" },
      options
    );
    assert.deepEqual(footer.columns, DEFAULT_FOOTER_COLUMNS);
    assert.deepEqual(footer.bottomLinks, DEFAULT_FOOTER_BOTTOM_LINKS);
  });
});
