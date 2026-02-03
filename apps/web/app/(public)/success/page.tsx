import Link from "next/link";

import { PageContainer } from "@/components/page-container";
import { SiteHeader } from "@/components/site-header";

export default function SuccessPage() {
  return (
    <div>
      <SiteHeader />
      <PageContainer>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Payment succeeded</h1>
          <p style={{ marginTop: 8, color: "#555" }}>
            Stripe Checkout redirected you back to the site.
          </p>
          <div style={{ marginTop: 14 }}>
            <Link
              href="/vehicles"
              style={{
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 8,
                textDecoration: "none",
                color: "#111",
                display: "inline-block",
              }}
            >
              Back to home
            </Link>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
