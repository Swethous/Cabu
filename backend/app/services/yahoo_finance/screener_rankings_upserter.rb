# frozen_string_literal: true

module YahooFinance
  class ScreenerRankingsUpserter
    def initialize(market:, kind:, quotes:, fetched_at:, limit:)
      @market    = market
      @kind      = kind
      @quotes    = Array(quotes).first(limit)
      @fetched_at = fetched_at
      @limit     = limit
    end

    def call
      return { stocks: 0, ranking_rows: 0 } if @quotes.empty?

      now = Time.current

      stock_rows = @quotes.map do |q|
        {
          yahoo_symbol: q["symbol"],
          market: @market,
          country: @market, # US/JP
          name: q["shortName"],
          currency: (q["currency"].presence || default_currency(@market)),
          last_seen_at: @fetched_at,
          created_at: now,
          updated_at: now
        }
      end

      Stock.upsert_all(stock_rows, unique_by: :index_stocks_on_yahoo_symbol)

      symbol_to_id =
        Stock.where(yahoo_symbol: stock_rows.map { |r| r[:yahoo_symbol] })
             .pluck(:yahoo_symbol, :id).to_h

      ranking_rows = @quotes.each_with_index.map do |q, idx|
        {
          market: @market,
          kind: @kind,
          rank: idx + 1,                # ✅ schema는 rank
          stock_id: symbol_to_id[q["symbol"]],
          as_of: q["as_of"],            # q에 as_of 넣어둔 상태면 들어감
          fetched_at: @fetched_at,
          extra: q["_raw"] || q,
          created_at: now,
          updated_at: now
        }
      end

      RankingRow.upsert_all(ranking_rows, unique_by: :index_ranking_rows_on_market_kind_rank)

      { stocks: stock_rows.size, ranking_rows: ranking_rows.size }
    end

    private

    def default_currency(market)
      market.to_s == "JP" ? "JPY" : "USD"
    end
  end
end