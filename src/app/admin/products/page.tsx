import { requireAdmin } from "@/lib/auth/admin-context";
import { PageHeader, Card, Field, Input, Toggle, Flash, Table, th, td, Badge } from "@/components/app/ui";
import { SubmitButton } from "@/components/app/submit-button";
import { cad, num } from "@/lib/format";
import { saveProduct } from "../actions";

export const metadata = { title: "Products" };

function ProductForm({ p }: { p?: { id: string; sku: string; name: string; size_oz: number; printed: boolean; units_per_case: number; units_per_sleeve: number; price_per_case_cents: number; sort_order: number; active: boolean } }) {
  return (
    <form action={saveProduct} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {p && <input type="hidden" name="product_id" value={p.id} />}
      <Field label="SKU"><Input name="sku" defaultValue={p?.sku ?? ""} required /></Field>
      <Field label="Name"><Input name="name" defaultValue={p?.name ?? ""} required /></Field>
      <Field label="Size (oz)"><Input name="size_oz" type="number" min={1} defaultValue={p?.size_oz ?? 12} required /></Field>
      <Field label="Price per case (cents)"><Input name="price_per_case_cents" type="number" min={0} defaultValue={p?.price_per_case_cents ?? 22000} required /></Field>
      <Field label="Cups per case"><Input name="units_per_case" type="number" min={1} defaultValue={p?.units_per_case ?? 1000} required /></Field>
      <Field label="Cups per sleeve"><Input name="units_per_sleeve" type="number" min={1} defaultValue={p?.units_per_sleeve ?? 50} required /></Field>
      <Field label="Sort order"><Input name="sort_order" type="number" defaultValue={p?.sort_order ?? 0} /></Field>
      <div className="flex flex-col gap-2">
        <Toggle name="printed" label="Custom printed" defaultChecked={p?.printed ?? false} />
        <Toggle name="active" label="Active" defaultChecked={p?.active ?? true} />
      </div>
      <div className="sm:col-span-2 lg:col-span-4"><SubmitButton size="sm" variant="dark">{p ? "Save" : "Add product"}</SubmitButton></div>
    </form>
  );
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { data: products } = await supabase.from("products").select("*").order("sort_order").order("size_oz");
  return (
    <>
      <PageHeader title="Products & pricing">Prices are in cents, CAD, per case, before tax. Changes apply to new reorders only.</PageHeader>
      <Flash ok={sp.ok} error={sp.error} />
      <Table>
        <thead><tr><th className={th}>SKU</th><th className={th}>Name</th><th className={th}>Size</th><th className={th}>Case</th><th className={th}>Price/case</th><th className={th}>Per cup</th><th className={th}>Status</th></tr></thead>
        <tbody>
          {(products ?? []).map((p) => (
            <tr key={p.id}>
              <td className={td}>{p.sku}</td><td className={td}>{p.name}</td><td className={td}>{p.size_oz}oz{p.printed && " printed"}</td>
              <td className={td}>{num(p.units_per_case)} cups · {p.units_per_case / p.units_per_sleeve} sleeves</td>
              <td className={td}>{cad(p.price_per_case_cents)}</td><td className={td}>{cad(p.price_per_case_cents / p.units_per_case)}</td>
              <td className={td}><Badge value={p.active ? "green" : "client"} label={p.active ? "active" : "inactive"} /></td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="mt-6 space-y-3">
        {(products ?? []).map((p) => (
          <details key={p.id} className="rounded-2xl border bg-white/70 p-4">
            <summary className="cursor-pointer font-bold">Edit {p.sku}</summary>
            <div className="mt-3"><ProductForm p={p} /></div>
          </details>
        ))}
        <Card title="Add product"><ProductForm /></Card>
      </div>
    </>
  );
}
