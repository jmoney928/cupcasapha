import { requireStaff } from "@/lib/auth/admin-context";
import { PageHeader, Flash } from "@/components/app/ui";
import { SubmitButton } from "@/components/app/submit-button";
import { CafeFormFields } from "@/components/app/cafe-form";
import { createCafe } from "../../actions";

export const metadata = { title: "New café" };

export default async function NewCafePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  await requireStaff();
  return (
    <>
      <PageHeader title="New café" />
      <Flash error={sp.error} />
      <form action={createCafe} className="space-y-4">
        <CafeFormFields />
        <SubmitButton>Create café</SubmitButton>
      </form>
    </>
  );
}
