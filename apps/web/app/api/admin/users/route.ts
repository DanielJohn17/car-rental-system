import { proxyToApi } from "../_utils";

export async function GET(request: Request) {
  return proxyToApi(request, "/users");
}

export async function POST(request: Request) {
  return proxyToApi(request, "/users");
}
