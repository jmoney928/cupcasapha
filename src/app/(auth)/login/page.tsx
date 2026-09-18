import Link from "next/link";
import type { Metadata } from "next";
import { Field, Input, Flash } from "@/components/app/ui";
import { SubmitButton } from "@/components/app/submit-button";
import { sendMagicLink, signInWithPassword } from "./actions";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const mode = sp.mode === "password" ? "password" : "magic";
  const next = sp.next ?? "";

  return (
    <>
      <h1 className="text-2xl">Sign in</h1>
      <p className="mt-1 text-sm text-cocoa">Café owners, managers and Cup Casa staff all sign in here.</p>

      <div className="mt-5 grid grid-cols-2 rounded-full bg-cream p-1 text-sm font-bold">
        <Link href={{ pathname: "/login", query: { next } }} className={`rounded-full py-1.5 text-center ${mode === "magic" ? "bg-espresso text-cream" : ""}`}>Email link</Link>
        <Link href={{ pathname: "/login", query: { mode: "password", next } }} className={`rounded-full py-1.5 text-center ${mode === "password" ? "bg-espresso text-cream" : ""}`}>Password</Link>
      </div>

      <div className="mt-5">
        <Flash error={sp.error} ok={sp.sent ? `Check ${sp.sent} for your sign-in link.` : undefined} />
      </div>

      {mode === "magic" ? (
        <form action={sendMagicLink} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <Field label="Email">
            <Input name="email" type="email" inputMode="email" autoComplete="email" required placeholder="you@cafe.ca" />
          </Field>
          <SubmitButton className="w-full">Send me a sign-in link</SubmitButton>
          <p className="text-xs text-cocoa">No password needed. The link works once and expires in an hour.</p>
        </form>
      ) : (
        <form action={signInWithPassword} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <Field label="Email">
            <Input name="email" type="email" inputMode="email" autoComplete="email" required />
          </Field>
          <Field label="Password">
            <Input name="password" type="password" autoComplete="current-password" required />
          </Field>
          <SubmitButton className="w-full">Sign in</SubmitButton>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-cocoa">
        Accounts are created by invitation. Need access? <a className="underline" href="mailto:hello@cupcasa.com">hello@cupcasa.com</a>
      </p>
    </>
  );
}
