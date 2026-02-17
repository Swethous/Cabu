import { proxyToRails } from "@/lib/bff";

export async function GET(req: Request) {
    return proxyToRails(req, "/api/v1/mypage/liked_posts", { requireAuth: true });
}
