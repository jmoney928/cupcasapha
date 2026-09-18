import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/admin-context";
import { twilioConfigured } from "@/lib/env";

/** Manual staff reply. Sending is wired to Twilio in step 6; until then it records intent only. */
export async function POST(request: NextRequest) {
  const { supabase } = await requireStaff();
  const form = await request.formData();
  const p = z.object({ cafe_id: z.string().uuid(), body: z.string().trim().min(1).max(1000) }).safeParse(Object.fromEntries(form));
  if (!p.success) return NextResponse.redirect(new URL("/admin/sms", request.url), { status: 303 });
  if (!twilioConfigured()) {
    return NextResponse.redirect(new URL(`/admin/sms/${p.data.cafe_id}?error=Twilio+not+configured`, request.url), { status: 303 });
  }
  const { sendSms } = await import("@/lib/twilio/send");
  await sendSms(supabase, p.data.cafe_id, p.data.body);
  return NextResponse.redirect(new URL(`/admin/sms/${p.data.cafe_id}`, request.url), { status: 303 });
}
