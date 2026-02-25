import { apiFetch } from "@/lib/api";
import { PageContainer } from "@/components/page-container";
import { SiteHeader } from "@/components/site-header";

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;

  const vehicles = await apiFetch<{ data: any[] }>(
    `/vehicles?limit=20`,
  );

  return (
    <div>
      <SiteHeader />
      <PageContainer>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Storefront</h1>
          <p style={{ marginTop: 6, color: "#555" }}>
            Account:{" "}
            <span style={{ fontFamily: "monospace" }}>{accountId}</span>
          </p>

          <div
            style={{
              marginTop: 16,
              display: "grid",
              gap: 10,
            }}
          >
            {(vehicles?.data ?? []).length === 0 ? (
              <div style={{ color: "#666" }}>No vehicles available.</div>
            ) : (
              (vehicles.data ?? []).map((v: any) => (
                <div
                  key={v.id}
                  style={{
                    border: "1px solid #e5e5e5",
                    borderRadius: 12,
                    padding: 14,
                    background: "#fff",
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 700 }}>
                    {v.make} {v.model} ({v.year})
                  </div>
                  <div style={{ marginTop: 6, color: "#555" }}>
                    Daily Rate: ${v.dailyRate}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </PageContainer>
    </div>
  );
}
