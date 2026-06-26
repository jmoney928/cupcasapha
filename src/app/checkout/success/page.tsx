import type { Metadata } from "next";
import { CheckCircle2, Leaf } from "lucide-react";
import { Button } from "@/components/ui";
import { ClearCartOnMount } from "@/components/clear-cart";
import { PurchaseTracker } from "@/components/purchase-tracker";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  return (
    <section className="section-pad py-28 text-center max-w-xl mx-auto">
      <ClearCartOnMount />
      <PurchaseTracker sessionId={session_id} />
      <div className="w-20 h-20 rounded-full bg-leaf flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-11 h-11 text-cream" />
      </div>
      <h1 className="font-display text-4xl sm:text-5xl font-bold">Order confirmed!</h1>
      <p className="text-lg text-espresso/70 mt-4">
        Thank you — your compostable cups are on the way. A receipt and tracking
        details are headed to your inbox.
      </p>
      <p className="inline-flex items-center gap-2 text-leaf font-semibold mt-6">
        <Leaf className="w-5 h-5" /> You just chose plastic-free. Nice one.
      </p>
      <div className="flex flex-wrap gap-4 justify-center mt-10">
        <Button href="/shop" variant="primary" size="lg">
          Keep shopping
        </Button>
        <Button href="/" variant="outline" size="lg">
          Back home
        </Button>
      </div>
    </section>
  );
}
