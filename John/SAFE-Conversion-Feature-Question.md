# SAFE Conversion Feature — Open Question

## Context

Priya Patel is listed as a stakeholder (type: investor, title: Seed Investor) on the Archer Technologies cap table. She shows **0 shares** on the Stakeholder Page despite having invested **$500,000**.

## Why 0 Shares Is Correct (For Now)

Priya's $500,000 is held as a **SAFE (Simple Agreement for Future Equity)**, not as issued shares. Her SAFE record:

| Field | Value |
|-------|-------|
| Investment Amount | $500,000 |
| Valuation Cap | $10,000,000 |
| Discount Rate | 20% |
| SAFE Type | Post-money |
| Status | Signed |
| Issue Date | 2024-06-01 |
| Notes | YC standard SAFE agreement |

A SAFE is a contract — it converts into actual shares only when a **triggering event** occurs.

## When Does Priya Get Shares?

A SAFE converts at the next **priced equity financing round** (typically a Series A). At conversion:

1. The system would calculate the share price using whichever is more favorable to Priya:
   - **Valuation cap method:** $10M cap / price-per-share at the round
   - **Discount method:** Round price minus 20% discount
2. The $500,000 investment divides by the lower of the two prices to determine how many shares Priya receives
3. A **security record** gets created on the cap table showing Priya's actual shares

Until that conversion event happens, the SAFE sits as an obligation — real money in, no shares out yet.

## What Tableicty Needs to Support This

The platform currently tracks the SAFE agreement (visible on the SAFEs page) but does **not** have an automated conversion workflow. To close the loop, a **SAFE Conversion Feature** would need to:

1. Add a "Convert SAFE" action button on each signed SAFE record
2. Prompt for the priced round details (price per share, round name)
3. Calculate conversion shares using cap vs. discount logic
4. Create a new security record for the investor on the cap table
5. Update the SAFE status from "signed" to "converted"
6. Record the conversion event in audit logs

### Conversion Formula Reference

**Cap method:**
```
Shares = Investment Amount / (Valuation Cap / Pre-money Fully Diluted Shares)
```

**Discount method:**
```
Shares = Investment Amount / (Round Price Per Share * (1 - Discount Rate))
```

**Result:** Investor gets whichever method produces MORE shares.

## Decision Needed

Should we build the SAFE conversion feature? This would:
- Allow triggering conversion when a priced round closes
- Auto-calculate share counts from SAFE terms
- Mint security records so investors like Priya appear on the cap table with actual shares
- Update SAFE status to "converted" with a link to the resulting security

This is a significant feature — it touches SAFEs, Securities, Cap Table, and Audit Logs.
