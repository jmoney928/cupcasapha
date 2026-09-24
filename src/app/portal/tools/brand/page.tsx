import { PageHeader } from "@/components/app/ui";
import { BrandKit } from "@/components/brand/brand-kit";
import { getPortalContext } from "@/lib/auth/cafe-context";

export const metadata = { title: "Brand kit", robots: { index: false } };

export default async function PortalBrandPage() {
  const { cafe } = await getPortalContext();
  return (
    <>
      <PageHeader title="Brand kit" eyebrow={cafe.name}>
        Upload your logo once and get signage, decals, till cards and social posts — print-ready, in about a minute.
      </PageHeader>
      <BrandKit />
    </>
  );
}
