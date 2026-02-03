import Link from "next/link";

import { PageContainer } from "@/components/page-container";

export default async function SubscriptionSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ session_id?: string }>;
}) {
  const params = (await searchParams) ?? {};

  return (
    <PageContainer>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Subscription started</h1>
        <p style={{ marginTop: 8, color: "#555" }}>
          Stripe Checkout redirected you back after starting your subscription.
        </p>
        <div style={{ marginTop: 10, fontFamily: "monospace" }}>
          session_id: {params.session_id ?? "(missing)"}
        </div>
        <div style={{ marginTop: 14 }}>
          <Link
            href="/admin/stripe-connect-demo"
            style={{
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: 8,
              textDecoration: "none",
              color: "#111",
              display: "inline-block",
            }}
          >
            Back to Stripe Connect demo
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
