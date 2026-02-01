import { proxyPublic } from "../_utils";

export async function POST(request: Request) {
  return proxyPublic(request, "/bookings");
}
