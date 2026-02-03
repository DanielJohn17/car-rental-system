import { proxyPublic } from "../../_utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyPublic(request, `/vehicles/${id}`);
}
