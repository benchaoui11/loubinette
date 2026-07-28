import { describe, expect, it } from "vitest";
import { classifyTraffic, lastNonDirectTouch } from "@/lib/attribution/classifier";

describe("traffic attribution", () => {
  it("classifies Google Ads from gclid", () => {
    expect(classifyTraffic({ gclid: "abc" }).category).toBe("google_ads");
  });

  it("detects AI referrers when referrer is available", () => {
    const result = classifyTraffic({ referrer: "https://chatgpt.com/c/some-thread" });
    expect(result.category).toBe("ai_referral");
    expect(result.sourceName).toBe("ChatGPT");
  });

  it("keeps last non-direct touch", () => {
    const touches = [
      classifyTraffic({ referrer: "https://google.com/search?q=idp" }),
      classifyTraffic({}),
    ];
    expect(lastNonDirectTouch(touches)?.category).toBe("google_organic");
  });
});
