/**
 * Promote (or create) the first admin.
 *   npm run make-admin -- you@cupcasa.com              → invites by email if the user doesn't exist
 *   npm run make-admin -- you@cupcasa.com 'Passw0rd!'  → creates with a password (no email needed)
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";

config({ path: ".env.local" });
const [email, password] = process.argv.slice(2);
if (!email) { console.error("usage: npm run make-admin -- <email> [password]"); process.exit(1); }
const db = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

async function main() {
  let { data: profile } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
  if (!profile) {
    const res = password
      ? await db.auth.admin.createUser({ email, password, email_confirm: true })
      : await db.auth.admin.inviteUserByEmail(email, { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/admin` });
    if (res.error) throw res.error;
    profile = { id: res.data.user!.id };
    console.log(password ? "Created user." : "Invitation email sent.");
  }
  const { error } = await db.from("profiles").update({ role: "admin" }).eq("id", profile.id);
  if (error) throw error;
  console.log(`${email} is now an admin.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
