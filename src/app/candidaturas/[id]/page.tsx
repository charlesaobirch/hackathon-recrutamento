import { Suspense } from "react";
import { ApplicationRecord } from "@/components/application-record";

async function ApplicationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ApplicationRecord id={id} />;
}

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={<div className="loading-panel">A abrir candidatura…</div>}
    >
      <ApplicationDetail params={params} />
    </Suspense>
  );
}
