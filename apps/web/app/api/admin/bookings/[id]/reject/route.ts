import { proxyToApi } from "../../../_utils";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToApi(request, `/bookings/${id}/reject`);
}
