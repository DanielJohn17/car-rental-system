import { proxyToApi } from "../../../_utils";

export async function POST(request: Request) {
  return proxyToApi(request, "/stripe-connect-demo/admin/subscription/checkout");
}
