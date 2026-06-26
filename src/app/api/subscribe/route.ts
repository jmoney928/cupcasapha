import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  console.log("Newsletter signup:", email);

  // Not configured yet — don't break the UX; the signup is logged.
  if (!apiKey || !audienceId) {
    console.warn("RESEND_API_KEY or RESEND_AUDIENCE_ID not set — subscriber not stored.");
    return NextResponse.json({ ok: true });
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.contacts.create({
      email,
      audienceId,
      unsubscribed: false,
    });
    // Treat "already a contact" as success.
    if (error && !/already|exists/i.test(error.message ?? "")) {
      console.error("Resend contacts.create error:", error);
      return NextResponse.json(
        { error: "Couldn't subscribe right now. Please try again." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("Subscribe failed:", err);
    return NextResponse.json(
      { error: "Couldn't subscribe right now. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
