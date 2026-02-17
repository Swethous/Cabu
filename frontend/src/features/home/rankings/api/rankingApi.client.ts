import { apiFetch } from "@/lib/apiClient";

export type RankingItem = {
    rank: number;
    id: number;
    symbol: string;
    name: string;
    name_jp: string | null;
    image_url: string | null;
    price?: number;
    change_percent?: number;
    market_cap?: number;
    score?: number;
};

export type RankingsResponse = {
    fetchedAt: string;
    limit: number;
    rankings: {
        [key: string]: RankingItem[];
    };
};

export function getRankings(limit = 20) {
    const qs = new URLSearchParams();
    qs.set("limit", String(limit));

    return apiFetch<RankingsResponse>(`/api/v1/rankings?${qs.toString()}`, {
        method: "GET",
    });
}
