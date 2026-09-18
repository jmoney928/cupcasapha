import Link from "next/link";
import { getPortalContext } from "@/lib/auth/cafe-context";
import { Card, Field, Input, Toggle, Flash, PageHeader, Badge } from "@/components/app/ui";
import { SubmitButton } from "@/components/app/submit-button";
import { stripeConfigured } from "@/lib/env";
import { hasSavedCard } from "@/lib/stripe/customers";
import { fullDate } from "@/lib/format";
import { updateSettings, manageCard } from "../actions";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { cafe, isOwner } = await getPortalContext();
  const cardOnFile = stripeConfigured() ? await hasSavedCard(cafe.stripe_customer_id).catch(() => false) : false;

  return (
    <>
      <PageHeader title="Settings" eyebrow={cafe.name} action={<Link href="/portal/settings/team" className="text-sm font-bold underline-offset-2 hover:underline">Team →</Link>} />
      <Flash ok={sp.ok} error={sp.error} />

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <form action={updateSettings} className="space-y-4">
          <input type="hidden" name="cafe_id" value={cafe.id} />
          <Card title="Replenishment">
            <div className="space-y-3">
              <Toggle name="auto_ship" label="Auto-ship" defaultChecked={cafe.auto_ship} hint="When a size runs low we ship the suggested top-up and charge your saved card, no approval text needed." />
              <Toggle name="sms_opt_in" label="Text me about my stock" defaultChecked={cafe.sms_opt_in}
                hint={`Weekly count check-ins and reorder approvals by SMS to your number below. Reply STOP any time. ${cafe.sms_opt_in_at ? `Consent recorded ${fullDate(cafe.sms_opt_in_at)}.` : ""}`} />
            </div>
          </Card>
          <Card title="Contact">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Café name"><Input name="name" defaultValue={cafe.name} required /></Field>
              <Field label="Mobile number for texts" hint="Canadian number, e.g. 416 555 0123"><Input name="phone" type="tel" inputMode="tel" defaultValue={cafe.phone ?? ""} /></Field>
              <Field label="Email"><Input name="contact_email" type="email" defaultValue={cafe.contact_email ?? ""} /></Field>
            </div>
          </Card>
          <Card title="Delivery address">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Street"><Input name="address_line1" defaultValue={cafe.address_line1 ?? ""} /></Field></div>
              <div className="sm:col-span-2"><Field label="Unit / buzzer"><Input name="address_line2" defaultValue={cafe.address_line2 ?? ""} /></Field></div>
              <Field label="City"><Input name="city" defaultValue={cafe.city ?? ""} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Province"><Input name="province" maxLength={2} defaultValue={cafe.province ?? ""} placeholder="ON" /></Field>
                <Field label="Postal code"><Input name="postal_code" defaultValue={cafe.postal_code ?? ""} /></Field>
              </div>
            </div>
          </Card>
          <SubmitButton className="w-full md:w-auto">Save settings</SubmitButton>
        </form>

        <div className="space-y-4">
          <Card title="Payment">
            <div className="mb-3 flex items-center gap-2 text-sm">
              <Badge value={cafe.payment_terms} label={cafe.payment_terms === "net30" ? "Net 30 invoicing" : "Card on file"} />
              {cafe.payment_terms === "card" && <span className="text-cocoa">{cardOnFile ? "Card saved ✓" : "No card saved"}</span>}
            </div>
            {cafe.payment_terms === "card" ? (
              <form action={manageCard}>
                <input type="hidden" name="cafe_id" value={cafe.id} />
                <SubmitButton variant="dark" className="w-full">{cardOnFile ? "Manage card & invoices" : "Add a card"}</SubmitButton>
                <p className="mt-2 text-xs text-cocoa">Opens Stripe’s secure page. We never see your card number.</p>
              </form>
            ) : (
              <p className="text-sm text-cocoa">Approved reorders are invoiced by email with 30-day terms. Invoices are also listed under Orders.</p>
            )}
          </Card>
          <Card title="Your role">
            <p className="text-sm text-cocoa">You are {isOwner ? "an owner" : "a manager"} of {cafe.name}. {isOwner ? "Owners can invite and remove team members." : "Ask an owner to change team access."}</p>
          </Card>
        </div>
      </div>
    </>
  );
}
