import { proxyPublic } from "../../_utils";

// Public endpoint used by the demo storefront.
export async function POST(request: Request) {
  return proxyPublic(request, "/stripe-connect-demo/storefront/checkout");
}
