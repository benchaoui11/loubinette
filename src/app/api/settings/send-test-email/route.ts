import "server-only";

import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { getServerEnv } from "@/lib/validation/env";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const TEST_EMAIL_SUBJECT = "Control Center Test Email";
const TEST_EMAIL_BODY = "This is a successful test from the Loubinette Control Center.";
const DEFAULT_FROM_EMAIL = "Loubinette Control Center <onboarding@resend.dev>";

type ResendErrorPayload = {
  message?: unknown;
  name?: unknown;
  error?: unknown;
};

export async function POST() {
  const env = getServerEnv();
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ error: "Not authorized to send test emails." }, { status: 403, headers: NO_STORE_HEADERS });
  }

  if (!env.OWNER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "OWNER_ADMIN_EMAIL is not configured." }, { status: 500, headers: NO_STORE_HEADERS });
  }

  if (!env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY is not configured." }, { status: 500, headers: NO_STORE_HEADERS });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL ?? DEFAULT_FROM_EMAIL,
        to: [env.OWNER_ADMIN_EMAIL],
        subject: TEST_EMAIL_SUBJECT,
        text: TEST_EMAIL_BODY,
      }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as ResendErrorPayload | { id?: unknown } | null;

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Resend rejected the test email.",
          details: resendErrorDetails(response.status, payload),
        },
        { status: 502, headers: NO_STORE_HEADERS },
      );
    }

    return NextResponse.json({ ok: true }, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Test email could not be sent.",
        details: error instanceof Error ? error.message : "Unexpected email delivery error.",
      },
      { status: 502, headers: NO_STORE_HEADERS },
    );
  }
}

function resendErrorDetails(status: number, payload: ResendErrorPayload | { id?: unknown } | null) {
  const message = textValue((payload as ResendErrorPayload | null)?.message);
  const name = textValue((payload as ResendErrorPayload | null)?.name);
  const error = textValue((payload as ResendErrorPayload | null)?.error);
  return [status ? `HTTP ${status}` : null, name, message, error].filter(Boolean).join(" - ");
}

function textValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
