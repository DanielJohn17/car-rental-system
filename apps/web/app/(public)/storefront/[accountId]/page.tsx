import { apiFetch } from "@/lib/api";
import { PageContainer } from "@/components/page-container";
import { SiteHeader } from "@/components/site-header";

type StripeProduct = {
  id: string;
  name: string;
  description?: string | null;
  default_price?: {
    id: string;
    unit_amount?: number | null;
    currency?: string | null;
  } | null;
};

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;

  // IMPORTANT (demo only): This uses the Stripe connected account ID directly
  // in the URL. In production you should use a stable public identifier.
  const products = await apiFetch<{ data: StripeProduct[] }>(
    `/stripe-connect-demo/storefront/products?accountId=${encodeURIComponent(accountId)}`,
  );

  return (
    <div>
      <SiteHeader />
      <PageContainer>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Storefront</h1>
          <p style={{ marginTop: 6, color: "#555" }}>
            Account: <span style={{ fontFamily: "monospace" }}>{accountId}</span>
          </p>

          <div
            style={{
              marginTop: 16,
              display: "grid",
              gap: 10,
            }}
          >
            {(products?.data ?? []).length === 0 ? (
              <div style={{ color: "#666" }}>No products available.</div>
            ) : (
              (products.data ?? []).map((p) => (
                <div
                  key={p.id}
                  style={{
                    border: "1px solid #e5e5e5",
                    borderRadius: 12,
                    padding: 14,
                    background: "#fff",
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</div>
                  <div style={{ marginTop: 6, color: "#555" }}>
                    {p.description || "(no description)"}
                  </div>

                  <div style={{ marginTop: 10, fontFamily: "monospace" }}>
                    Price ID: {p.default_price?.id ?? "(missing)"}
                  </div>

                  <form
                    action="/api/public/stripe-connect-demo/checkout-redirect"
                    method="post"
                    style={{ marginTop: 12, display: "flex", gap: 8 }}
                  >
                    <input type="hidden" name="accountId" value={accountId} />
                    <input
                      type="hidden"
                      name="priceId"
                      value={p.default_price?.id ?? ""}
                    />
                    <input
                      type="hidden"
                      name="quantity"
                      value={"1"}
                    />
                    <input
                      type="hidden"
                      name="successUrl"
                      value={
                        "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}"
                      }
                    />
                    <input
                      type="hidden"
                      name="cancelUrl"
                      value={`http://localhost:3000/storefront/${encodeURIComponent(accountId)}`}
                    />
                    <button
                      type="submit"
                      disabled={!p.default_price?.id}
                      style={{
                        background: "#0b5fff",
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        padding: "10px 14px",
                        cursor: "pointer",
                        opacity: p.default_price?.id ? 1 : 0.5,
                      }}
                    >
                      Buy
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: 18, color: "#666" }}>
            Note: For simplicity, the success/cancel URLs in this demo are
            hardcoded. Update them for your environment.
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
