import { z } from "zod";

export const sourceCategorySchema = z.enum([
  "google_ads",
  "google_organic",
  "bing_organic",
  "other_organic",
  "ai_referral",
  "social",
  "email",
  "affiliate",
  "referral",
  "direct",
  "unknown",
]);

export type SourceCategory = z.infer<typeof sourceCategorySchema>;

export type AttributionInput = {
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  gclid?: string | null;
  msclkid?: string | null;
};

export type AttributionResult = {
  category: SourceCategory;
  sourceName: string;
  referrerDomain: string | null;
  confidence: "high" | "medium" | "low";
};

const AI_DOMAINS = [
  ["chatgpt.com", "ChatGPT"],
  ["openai.com", "ChatGPT"],
  ["perplexity.ai", "Perplexity"],
  ["gemini.google.com", "Gemini"],
  ["claude.ai", "Claude"],
  ["copilot.microsoft.com", "Microsoft Copilot"],
  ["you.com", "You.com"],
] as const;

const SOCIAL_DOMAINS = ["facebook.com", "instagram.com", "t.co", "twitter.com", "x.com", "linkedin.com", "youtube.com", "tiktok.com"];

function domainFrom(referrer?: string | null) {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function includesDomain(domain: string, needle: string) {
  return domain === needle || domain.endsWith(`.${needle}`);
}

export function classifyTraffic(input: AttributionInput): AttributionResult {
  const utmSource = input.utmSource?.trim().toLowerCase() || "";
  const utmMedium = input.utmMedium?.trim().toLowerCase() || "";
  const referrerDomain = domainFrom(input.referrer);

  if (input.gclid) return { category: "google_ads", sourceName: "Google Ads", referrerDomain, confidence: "high" };
  if (input.msclkid) return { category: "bing_organic", sourceName: "Microsoft/Bing click", referrerDomain, confidence: "medium" };

  if (utmMedium === "email") return { category: "email", sourceName: utmSource || "Email", referrerDomain, confidence: "high" };
  if (utmMedium === "affiliate") return { category: "affiliate", sourceName: utmSource || "Affiliate", referrerDomain, confidence: "high" };
  if (utmMedium.includes("cpc") || utmMedium.includes("paid")) {
    return { category: utmSource.includes("google") ? "google_ads" : "referral", sourceName: utmSource || "Paid campaign", referrerDomain, confidence: "high" };
  }

  if (!referrerDomain) return { category: "direct", sourceName: "Direct", referrerDomain: null, confidence: "low" };

  const ai = AI_DOMAINS.find(([domain]) => includesDomain(referrerDomain, domain));
  if (ai) return { category: "ai_referral", sourceName: ai[1], referrerDomain, confidence: "high" };

  if (includesDomain(referrerDomain, "google.com")) return { category: "google_organic", sourceName: "Google Organic", referrerDomain, confidence: "medium" };
  if (includesDomain(referrerDomain, "bing.com")) return { category: "bing_organic", sourceName: "Bing Organic", referrerDomain, confidence: "medium" };
  if (["yahoo.com", "duckduckgo.com", "ecosia.org", "baidu.com", "yandex.com"].some((d) => includesDomain(referrerDomain, d))) {
    return { category: "other_organic", sourceName: referrerDomain, referrerDomain, confidence: "medium" };
  }
  if (SOCIAL_DOMAINS.some((d) => includesDomain(referrerDomain, d))) {
    return { category: "social", sourceName: referrerDomain, referrerDomain, confidence: "medium" };
  }

  return { category: "referral", sourceName: referrerDomain, referrerDomain, confidence: "medium" };
}

export function lastNonDirectTouch(touches: AttributionResult[]) {
  return [...touches].reverse().find((touch) => touch.category !== "direct") ?? touches.at(-1) ?? null;
}
