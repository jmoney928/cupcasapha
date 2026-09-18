import { Card, Field, Input, Select, Toggle } from "@/components/app/ui";
import type { Cafe } from "@/lib/auth/cafe-context";

/** Shared create/edit form body for staff. Wrap in a <form action=…>. */
export function CafeFormFields({ cafe }: { cafe?: Cafe }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Café">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Name"><Input name="name" defaultValue={cafe?.name ?? ""} required /></Field></div>
          <Field label="SMS phone (E.164)"><Input name="phone" type="tel" defaultValue={cafe?.phone ?? ""} placeholder="+14165550123" /></Field>
          <Field label="Contact email"><Input name="contact_email" type="email" defaultValue={cafe?.contact_email ?? ""} /></Field>
          <div className="sm:col-span-2"><Field label="Street"><Input name="address_line1" defaultValue={cafe?.address_line1 ?? ""} /></Field></div>
          <div className="sm:col-span-2"><Field label="Unit"><Input name="address_line2" defaultValue={cafe?.address_line2 ?? ""} /></Field></div>
          <Field label="City"><Input name="city" defaultValue={cafe?.city ?? ""} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Province"><Input name="province" maxLength={2} defaultValue={cafe?.province ?? "ON"} /></Field>
            <Field label="Postal"><Input name="postal_code" defaultValue={cafe?.postal_code ?? ""} /></Field>
          </div>
        </div>
      </Card>
      <Card title="Commercial & replenishment">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Payment terms">
            <Select name="payment_terms" defaultValue={cafe?.payment_terms ?? "card"}><option value="card">Card on file</option><option value="net30">Net 30 invoice</option></Select>
          </Field>
          <Field label="Tax rate (bps)" hint="1300 = 13% HST"><Input name="tax_rate_bps" type="number" min={0} max={3000} defaultValue={cafe?.tax_rate_bps ?? 1300} /></Field>
          <Field label="Lead time (days)"><Input name="lead_time_days" type="number" min={0} max={60} defaultValue={cafe?.lead_time_days ?? 3} /></Field>
          <Field label="Safety stock (days)"><Input name="safety_days" type="number" min={0} max={60} defaultValue={cafe?.safety_days ?? 5} /></Field>
          <div className="space-y-2 sm:col-span-2">
            <Toggle name="auto_ship" label="Auto-ship" defaultChecked={cafe?.auto_ship ?? false} hint="Charge and ship without asking." />
            <Toggle name="sms_opt_in" label="SMS opt-in" defaultChecked={cafe?.sms_opt_in ?? false} hint="Only tick if the café gave consent (CASL). Timestamp is recorded." />
            <Toggle name="active" label="Active" defaultChecked={cafe?.active ?? true} hint="Inactive cafés are skipped by the reorder engine." />
          </div>
        </div>
      </Card>
    </div>
  );
}
