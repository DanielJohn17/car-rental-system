import { proxyPublic } from "../_utils";

export async function GET(request: Request) {
  return proxyPublic(request, "/locations");
}
