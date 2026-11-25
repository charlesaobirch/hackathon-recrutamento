import { Suspense } from "react";
import { SalaryRecord } from "@/components/salary-record";

async function OfferDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SalaryRecord id={id} />;
}

export default function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="loading-panel">A abrir proposta…</div>}>
      <OfferDetail params={params} />
    </Suspense>
  );
}
