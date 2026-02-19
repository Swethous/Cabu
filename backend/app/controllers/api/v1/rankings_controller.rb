module Api
  module V1
    class RankingsController < ApplicationController
      skip_before_action :authenticate_user!, only: [:index]

      # GET /api/v1/rankings
      def index
        limit = (params[:limit].presence || 20).to_i

        # 1. 모든 랭킹 데이터 한 번에 조회 (N+1 방지)
        # 인기 랭킹(market='ALL', kind='popular') 포함
        rows = RankingRow.includes(stock: :stock_snapshot)
                         .where(rank: 1..limit)
                         .order(:market, :kind, :rank)
        instrument_name_jp_by_symbol = build_instrument_name_jp_map(rows)

        # 2. 그룹핑 (market:kind 형태의 키로 묶기 + popular 별도 처리)
        # 예: "US:market_cap" => [...], "popular" => [...]
        rankings = Hash.new { |h, k| h[k] = [] }

        rows.each do |row|
          key = if row.kind == "popular"
                  "popular"
                else
                  "#{row.market}:#{row.kind}"
                end
          
          rankings[key] << serialize_row(row, instrument_name_jp_by_symbol)
        end

        render json: {
          fetchedAt: Time.current.iso8601,
          limit: limit,
          rankings: rankings
        }
      end

      private

      def serialize_row(row, instrument_name_jp_by_symbol)
        stock = row.stock
        snapshot = stock.stock_snapshot

        {
          rank: row.rank,
          id: stock.id,
          symbol: stock.yahoo_symbol,
          name: stock.name,     # 영어 이름
          name_jp: preferred_name_jp(stock, instrument_name_jp_by_symbol), # 일본어 이름 우선
          image_url: nil,       # 로고 이미지 있으면 추가
          price: snapshot&.price&.to_f,
          change_percent: snapshot&.change_percent&.to_f,
          market_cap: snapshot&.market_cap,
          score: row.extra["score"] # 인기 랭킹일 때 점수
        }
      end

      def preferred_name_jp(stock, instrument_name_jp_by_symbol)
        StockNameOverrides.ja(stock.yahoo_symbol).presence ||
          instrument_name_jp_by_symbol[stock.yahoo_symbol].presence ||
          stock.name_jp.presence
      end

      def build_instrument_name_jp_map(rows)
        symbols = rows.map { |row| row.stock&.yahoo_symbol }.compact.uniq
        return {} if symbols.empty?

        active_rows = InstrumentMaster.active
                                      .where(symbol: symbols)
                                      .where.not(name_jp: [nil, ""])
                                      .pluck(:symbol, :name_jp)

        fallback_rows = InstrumentMaster
                        .where(symbol: symbols)
                        .where.not(name_jp: [nil, ""])
                        .pluck(:symbol, :name_jp)

        fallback_rows.to_h.merge(active_rows.to_h)
      end
    end
  end
end
