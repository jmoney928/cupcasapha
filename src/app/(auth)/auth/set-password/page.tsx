import { Field, Input, Flash } from "@/components/app/ui";
import { SubmitButton } from "@/components/app/submit-button";
import { requireSession } from "@/lib/auth/session";
import { setPassword } from "./actions";

export const metadata = { title: "Set your password", robots: { index: false } };

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { profile } = await requireSession();
  return (
    <>
      <h1 className="text-2xl">Welcome to Cup Casa</h1>
      <p className="mt-1 text-sm text-cocoa">Set a password so you can sign in without a link next time. You can always use an email link instead.</p>
      <div className="mt-5"><Flash error={sp.error} /></div>
      <form action={setPassword} className="space-y-4">
        <Field label="Your name">
          <Input name="full_name" defaultValue={profile.full_name ?? ""} autoComplete="name" />
        </Field>
        <Field label="New password" hint="At least 8 characters">
          <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <SubmitButton className="w-full">Save and continue</SubmitButton>
      </form>
    </>
  );
}
