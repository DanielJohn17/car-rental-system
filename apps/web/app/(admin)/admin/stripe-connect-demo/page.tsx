import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { PageContainer } from "@/components/page-container";
import { InlineError } from "@/components/inline-error";

type ConnectStatus = {
  stripeConnectAccountId: string | null;
  readyToProcessPayments: boolean;
  requirementsStatus?: string;
  onboardingComplete: boolean;
};

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

export default async function StripeConnectDemoPage({
  searchParams,
}: {
  searchParams?: Promise<{ stripeError?: string }>;
}) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    redirect("/admin/login");
  }

  const params = (await searchParams) ?? {};
  const stripeError = params.stripeError;

  let status: ConnectStatus | null = null;
  try {
    status = await apiFetch<ConnectStatus>(
      "/stripe-connect-demo/admin/status",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  } catch {
    status = null;
  }

  let products: StripeProduct[] = [];
  try {
    const res = await apiFetch<{ data: StripeProduct[] }>(
      "/stripe-connect-demo/admin/products",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    products = res?.data ?? [];
  } catch {
    products = [];
  }

  return (
    <PageContainer>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700 }}>
              Stripe Connect Demo
            </h1>
            <p style={{ marginTop: 6, color: "#555" }}>
              Onboard, create products, and share a simple storefront.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link
              href="/admin/dashboard"
              style={{
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 8,
                textDecoration: "none",
                color: "#111",
              }}
            >
              Back to dashboard
            </Link>
          </div>
        </div>

        <InlineError message={stripeError} className="mt-4" />

        <section
          style={{
            marginTop: 20,
            padding: 16,
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            background: "#fff",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>
            1) Onboard to Connect
          </h2>
          <p style={{ marginTop: 6, color: "#444" }}>
            This demo uses the Stripe Connect <strong>V2 Accounts API</strong>{" "}
            and
            <strong> V2 Account Links</strong>.
          </p>

          <div style={{ marginTop: 10 }}>
            <div style={{ fontFamily: "monospace", fontSize: 13 }}>
              Connected account ID: {status?.stripeConnectAccountId ?? "(none)"}
            </div>
            <div style={{ marginTop: 6 }}>
              <strong>Ready to process payments:</strong>{" "}
              {status?.readyToProcessPayments ? "Yes" : "No"}
            </div>
            <div style={{ marginTop: 6 }}>
              <strong>Requirements status:</strong>{" "}
              {status?.requirementsStatus ?? "(unknown)"}
            </div>
            <div style={{ marginTop: 6 }}>
              <strong>Onboarding complete:</strong>{" "}
              {status?.onboardingComplete ? "Yes" : "No"}
            </div>
          </div>

          <form
            action="/api/admin/stripe-connect-demo/onboard"
            method="post"
            style={{ marginTop: 12 }}
          >
            <button
              type="submit"
              style={{
                background: "#111",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 14px",
                cursor: "pointer",
              }}
            >
              Onboard to collect payments
            </button>
          </form>
        </section>

        <section
          style={{
            marginTop: 16,
            padding: 16,
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            background: "#fff",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>2) Create products</h2>
          <p style={{ marginTop: 6, color: "#444" }}>
            Products are created on the connected account using the
            <strong> Stripe-Account</strong> header.
          </p>

          <form
            action="/api/admin/stripe-connect-demo/products"
            method="post"
            style={{ marginTop: 12, display: "grid", gap: 8 }}
          >
            <input
              name="name"
              placeholder="Product name"
              required
              style={{
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 10,
              }}
            />
            <input
              name="description"
              placeholder="Description (optional)"
              style={{
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 10,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <input
                name="priceInCents"
                placeholder="Price (cents)"
                type="number"
                min={0}
                required
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 10,
                }}
              />
              <input
                name="currency"
                placeholder="Currency"
                defaultValue="usd"
                required
                style={{
                  width: 120,
                  padding: "10px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 10,
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                background: "#0b5fff",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 14px",
                cursor: "pointer",
              }}
            >
              Create product
            </button>
          </form>

          <div style={{ marginTop: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Current products</h3>
            {products.length === 0 ? (
              <div style={{ marginTop: 6, color: "#666" }}>
                No products yet.
              </div>
            ) : (
              <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                {products.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      border: "1px solid #eee",
                      borderRadius: 10,
                      padding: 12,
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div style={{ marginTop: 4, color: "#555" }}>
                      {p.description || "(no description)"}
                    </div>
                    <div style={{ marginTop: 6, fontFamily: "monospace" }}>
                      Price ID: {p.default_price?.id ?? "(missing)"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {status?.stripeConnectAccountId ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                Storefront link
              </div>
              <div style={{ marginTop: 6, fontFamily: "monospace" }}>
                /storefront/{status.stripeConnectAccountId}
              </div>
              <div style={{ marginTop: 6, color: "#666" }}>
                In production, do not expose the raw Stripe account ID in URLs.
              </div>
              <div style={{ marginTop: 8 }}>
                <Link
                  href={`/storefront/${status.stripeConnectAccountId}`}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    textDecoration: "none",
                    color: "#111",
                    display: "inline-block",
                  }}
                >
                  View storefront
                </Link>
              </div>
            </div>
          ) : null}
        </section>

        <section
          style={{
            marginTop: 16,
            padding: 16,
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            background: "#fff",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>3) Subscription</h2>
          <p style={{ marginTop: 6, color: "#444" }}>
            This demo uses a hosted Checkout Session (mode=subscription) with
            <code>customer_account</code> set to the connected account ID.
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <form
              action="/api/admin/stripe-connect-demo/subscription/checkout-redirect"
              method="post"
            >
              <button
                type="submit"
                style={{
                  background: "#111",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 14px",
                  cursor: "pointer",
                }}
              >
                Subscribe
              </button>
            </form>

            <form
              action="/api/admin/stripe-connect-demo/subscription/billing-portal-redirect"
              method="post"
            >
              <button
                type="submit"
                style={{
                  background: "#fff",
                  color: "#111",
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: "10px 14px",
                  cursor: "pointer",
                }}
              >
                Manage subscription
              </button>
            </form>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
