// Prints a Supabase session cookie for curl-testing guarded routes against the LOCAL stack.
//   node scripts/dev-session-cookie.mjs alice@northside.test [password]
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
const [email, password = "cupcasa-demo"] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url?.includes("127.0.0.1") && !url?.includes("localhost")) { console.error("local stack only"); process.exit(1); }
const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const { data, error } = await sb.auth.signInWithPassword({ email, password });
if (error) { console.error(error.message); process.exit(1); }
const ref = new URL(url).hostname.split(".")[0];
console.log(`sb-${ref}-auth-token=base64-${Buffer.from(JSON.stringify(data.session)).toString("base64url")}`);
