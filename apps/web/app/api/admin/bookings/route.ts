import { proxyToApi } from "../_utils";

export async function GET(request: Request) {
  return proxyToApi(request, "/bookings");
}
