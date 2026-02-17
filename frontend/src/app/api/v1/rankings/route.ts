import { proxyToRails } from "@/lib/bff";

export async function GET(req: Request) {
    return proxyToRails(req, "/api/v1/rankings", {
        method: "GET",
        cache: "force-cache",
        next: { revalidate: 600 },
    });
}
