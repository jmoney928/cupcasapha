import { NextResponse } from "next/server";
import { Resend } from "resend";

// Human-friendly labels for known fields (others fall back to the raw key).
const LABELS: Record<string, string> = {
  name: "Name",
  email: "Email",
  company: "Business",
  phone: "Phone",
  volume: "Estimated volume",
  sizes: "Sizes of interest",
  message: "Message",
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(req: Request) {
  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = String(data.name ?? "").trim();
  const email = String(data.email ?? "").trim();
  if (!name || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please provide a valid name and email." },
      { status: 400 }
    );
  }

  const type = String(data.type ?? "contact");
  const company = String(data.company ?? "").trim();
  const to = process.env.LEADS_EMAIL ?? "cupcasaadmin@gmail.com";
  const from = process.env.LEADS_FROM ?? "cupcasa cups <onboarding@resend.dev>";

  // Build the message body from all submitted fields (excluding meta).
  const rows = Object.entries(data)
    .filter(([k, v]) => k !== "type" && String(v ?? "").trim() !== "")
    .map(([k, v]) => ({ label: LABELS[k] ?? k, value: String(v) }));

  const subject =
    type === "wholesale"
      ? `New wholesale enquiry — ${name}${company ? ` (${company})` : ""}`
      : `New contact message — ${name}${company ? ` (${company})` : ""}`;

  const text =
    `New ${type} submission from cupcasa cups\n\n` +
    rows.map((r) => `${r.label}: ${r.value}`).join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px">
      <h2 style="color:#3a2417;margin-bottom:4px">New ${esc(type)} submission</h2>
      <p style="color:#6f4a30;margin-top:0">From cups.cupcasa.com</p>
      <table style="border-collapse:collapse;width:100%">
        ${rows
          .map(
            (r) => `<tr>
              <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#6f4a30;font-weight:600;vertical-align:top;white-space:nowrap">${esc(
                r.label
              )}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#3a2417">${esc(
                r.value
              ).replace(/\n/g, "<br>")}</td>
            </tr>`
          )
          .join("")}
      </table>
    </div>`;

  const apiKey = process.env.RESEND_API_KEY;

  // Always log as a backup trail regardless of email delivery.
  console.log("New lead:", { type, ...rows.reduce((o, r) => ({ ...o, [r.label]: r.value }), {}) });

  if (!apiKey) {
    // Email not configured yet — don't fail the user; the submission is logged.
    console.warn("RESEND_API_KEY not set — lead email not sent.");
    return NextResponse.json({ ok: true });
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject,
      text,
      html,
    });
    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "We couldn't send your message right now. Please email us directly." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("Lead email failed:", err);
    return NextResponse.json(
      { error: "We couldn't send your message right now. Please email us directly." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
