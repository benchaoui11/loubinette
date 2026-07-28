# Attribution Model

The model is deterministic and honest.

Priority:

1. Click IDs such as `gclid` and `msclkid`.
2. UTM source/medium/campaign fields.
3. Referrer domain.
4. Direct or Unknown.

Categories:

- `google_ads`
- `google_organic`
- `bing_organic`
- `other_organic`
- `ai_referral`
- `social`
- `email`
- `affiliate`
- `referral`
- `direct`
- `unknown`

AI referrers detected when referrer exists:

- ChatGPT
- Perplexity
- Gemini
- Claude
- Microsoft Copilot
- You.com
- other known AI assistants over time

Limitations:

- AI tools and browsers may suppress referrers.
- Direct traffic may include unattributed campaigns.
- Organic keywords are usually unavailable.
- Historical FirstIDP visitor records do not contain enough fields to reconstruct attribution.
- A visitor cannot always be personally identified.

Touch model:

- First touch is preserved and not overwritten.
- Session touch is stored per session.
- Last non-direct touch ignores direct visits when a previous non-direct touch exists.
