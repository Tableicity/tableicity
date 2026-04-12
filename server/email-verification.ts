import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { emailVerifications, users } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

function generateCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function createVerificationCode(userId: string): Promise<string> {
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await db.insert(emailVerifications).values({
    userId,
    codeHash,
    expiresAt,
    attempts: 0,
    used: false,
    createdAt: new Date().toISOString(),
  });

  return code;
}

export async function verifyCode(userId: string, code: string): Promise<{ success: boolean; message: string }> {
  const [verification] = await db
    .select()
    .from(emailVerifications)
    .where(
      and(
        eq(emailVerifications.userId, userId),
        eq(emailVerifications.used, false)
      )
    )
    .orderBy(desc(emailVerifications.createdAt))
    .limit(1);

  if (!verification) {
    return { success: false, message: "No verification code found. Please request a new one." };
  }

  if (new Date(verification.expiresAt) < new Date()) {
    return { success: false, message: "Verification code has expired. Please request a new one." };
  }

  if (verification.attempts >= 5) {
    return { success: false, message: "Too many failed attempts. Please request a new code." };
  }

  const isValid = await bcrypt.compare(code, verification.codeHash);

  if (!isValid) {
    await db
      .update(emailVerifications)
      .set({ attempts: verification.attempts + 1 })
      .where(eq(emailVerifications.id, verification.id));
    return { success: false, message: "Invalid verification code." };
  }

  await db
    .update(emailVerifications)
    .set({ used: true })
    .where(eq(emailVerifications.id, verification.id));

  await db
    .update(users)
    .set({ emailVerified: true })
    .where(eq(users.id, userId));

  return { success: true, message: "Email verified successfully." };
}

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const showCode = process.env.NODE_ENV !== "production" || process.env.BETA_LAB_CODE === "true";
  if (showCode) {
    console.log(`\n========================================`);
    console.log(`[EMAIL VERIFICATION] Code for ${email}: ${code}`);
    console.log(`========================================\n`);
  } else {
    console.log(`[EMAIL VERIFICATION] Code sent to ${email}`);
  }

  const sesRegion = process.env.AWS_SES_REGION;
  const fromEmail = process.env.AWS_SES_FROM_EMAIL;
  const hasAwsCreds = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

  if (sesRegion && fromEmail && hasAwsCreds) {
    (async () => {
      try {
        const { SESClient, SendEmailCommand } = await import("@aws-sdk/client-ses");
        const ses = new SESClient({ region: sesRegion });

        await ses.send(new SendEmailCommand({
          Source: fromEmail,
          Destination: { ToAddresses: [email] },
          Message: {
            Subject: { Data: "Tableicity - Verify Your Email", Charset: "UTF-8" },
            Body: {
              Html: {
                Charset: "UTF-8",
                Data: `
                  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                    <h2 style="color: #1e3a5f;">Tableicity</h2>
                    <p>Your verification code is:</p>
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 16px; background: #f4f6f8; border-radius: 8px; margin: 16px 0;">
                      ${code}
                    </div>
                    <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
                  </div>
                `,
              },
              Text: {
                Charset: "UTF-8",
                Data: `Your Tableicity verification code is: ${code}\n\nThis code expires in 10 minutes.`,
              },
            },
          },
        }));

        console.log(`[EMAIL] Verification code sent to ${email} via AWS SES`);
      } catch (err) {
        console.error(`[EMAIL] SES send failed (code was logged above):`, err);
      }
    })();
  }
}

export async function canResendCode(userId: string): Promise<boolean> {
  const [recent] = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.userId, userId))
    .orderBy(desc(emailVerifications.createdAt))
    .limit(1);

  if (!recent) return true;

  const timeSince = Date.now() - new Date(recent.createdAt).getTime();
  return timeSince > 60 * 1000;
}
