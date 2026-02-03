import { proxyToApi } from "../../_utils";

// Returns onboarding / capability status for the current admin connected account.
export async function GET(request: Request) {
  return proxyToApi(request, "/stripe-connect-demo/admin/status");
}
