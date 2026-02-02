import Link from "next/link";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Booking created</h1>
      <p style={{ marginBottom: 12 }}>
        Reference: <strong>{ref}</strong>
      </p>
      <p style={{ opacity: 0.85, marginBottom: 16 }}>
        If you completed the Stripe deposit payment, your booking will be
        processed by the sales team.
      </p>
      <Link href="/vehicles">Back to vehicles</Link>
    </main>
  );
}
