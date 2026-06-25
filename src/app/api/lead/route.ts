import { NextResponse } from "next/server";

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

  // Persist / forward the lead. Wire up an email or CRM provider here
  // (e.g. Resend, Postmark, a Google Sheet, HubSpot...). For now we log it.
  console.log("New lead:", {
    type: data.type ?? "contact",
    name,
    email,
    company: data.company ?? "",
    phone: data.phone ?? "",
    volume: data.volume ?? "",
    message: data.message ?? "",
    to: process.env.LEADS_EMAIL ?? "cupcasaadmin@gmail.com",
  });

  return NextResponse.json({ ok: true });
}
