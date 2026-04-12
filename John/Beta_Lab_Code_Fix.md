# BETA LAB CODE FIX — Correction Order for EU Remix

## Date: April 1, 2026 | Priority: HIGH — Production login broken without this

---

## THE PROBLEM

The security fix we both applied (hiding `lab_code` from API responses when `NODE_ENV === "production"`) broke the deployed login flow. During beta, users rely on seeing the lab code on the Verify Identity card because AWS SES email delivery may not be configured or reliable for all addresses. With the code hidden in production, users can't log in.

## THE FIX

Replace the `NODE_ENV !== "production"` check with a `shouldExposeLabCode()` helper that respects a new `BETA_LAB_CODE` environment variable. When `BETA_LAB_CODE=true`, the lab code is returned in API responses even in production. When beta ends, remove the env var and the code is hidden.

---

## CHANGES REQUIRED

### 1. `server/auth.ts` — Add helper function

Add this function near the top of the file (before `setupAuth`):

```typescript
function shouldExposeLabCode(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.BETA_LAB_CODE === "true";
}
```

### 2. `server/auth.ts` — Replace all three occurrences

Find every instance of:
```typescript
...(process.env.NODE_ENV !== "production" ? { lab_code: code } : {}),
```

Replace with:
```typescript
...(shouldExposeLabCode() ? { lab_code: code } : {}),
```

There are exactly 3 locations:
- Register endpoint (~line 267) — `res.status(201).json`
- Login MFA endpoint (~line 301) — `res.json` after `requiresMfa`
- Resend code endpoint (~line 403) — `res.json` after resend

### 3. `server/email-verification.ts` — Update log gating

Find the `sendVerificationEmail` function. Replace the logging block:

```typescript
// BEFORE:
if (process.env.NODE_ENV === "production") {
  console.log(`[EMAIL VERIFICATION] Code sent to ${email}`);
} else {
  console.log(`\n========================================`);
  console.log(`[EMAIL VERIFICATION] Code for ${email}: ${code}`);
  console.log(`========================================\n`);
}

// AFTER:
const showCode = process.env.NODE_ENV !== "production" || process.env.BETA_LAB_CODE === "true";
if (showCode) {
  console.log(`\n========================================`);
  console.log(`[EMAIL VERIFICATION] Code for ${email}: ${code}`);
  console.log(`========================================\n`);
} else {
  console.log(`[EMAIL VERIFICATION] Code sent to ${email}`);
}
```

### 4. Set the environment variable

Add to your environment (Replit Secrets or `.env`):
```
BETA_LAB_CODE=true
```

This should be set in the **shared** environment so it applies to both dev and production.

---

## HOW IT WORKS

| Condition | Lab code in API response? | Lab code in server logs? |
|-----------|--------------------------|-------------------------|
| Dev environment (any) | Yes | Yes |
| Production + `BETA_LAB_CODE=true` | Yes | Yes |
| Production + no `BETA_LAB_CODE` | No | No |
| Production + `BETA_LAB_CODE=false` | No | No |

## END OF BETA

When beta ends and AWS SES email delivery is fully operational:

1. Delete the `BETA_LAB_CODE` environment variable (or set to `false`)
2. The lab code disappears from all API responses and server logs in production
3. Users receive their MFA code exclusively via email
4. No code changes needed — just the env var removal

---

## FILES MODIFIED

- `server/auth.ts` — Added `shouldExposeLabCode()` helper, updated 3 response locations
- `server/email-verification.ts` — Updated log gating to respect `BETA_LAB_CODE`

## VERIFICATION

After applying and restarting:
1. Login should show the "Lab Mode — Your Code" card on the Verify Identity screen
2. Server logs should show the code in the email verification output
3. The bottom text should say "Enter your code above" (not "Check Replit Logs")

---

*— Tableicity Architect*
