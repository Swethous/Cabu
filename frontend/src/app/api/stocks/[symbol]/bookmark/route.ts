import { proxyToRails } from "@/lib/bff";

export async function GET(req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw).toUpperCase();

  return proxyToRails(req, `/api/v1/stocks/${encodeURIComponent(symbol)}/bookmark`, {
    requireAuth: true,
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw).toUpperCase();

  return proxyToRails(req, `/api/v1/stocks/${encodeURIComponent(symbol)}/bookmark`, {
    method: "POST",
    requireAuth: true,
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw).toUpperCase();

  return proxyToRails(req, `/api/v1/stocks/${encodeURIComponent(symbol)}/bookmark`, {
    method: "DELETE",
    requireAuth: true,
  });
}
