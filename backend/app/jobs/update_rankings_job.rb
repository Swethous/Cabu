# frozen_string_literal: true

class UpdateRankingsJob < ApplicationJob
  queue_as :default

  SCREENS = [
    { market: "US", kind: "market_cap" },
    { market: "US", kind: "gainers" },
    { market: "US", kind: "losers" },
    { market: "JP", kind: "market_cap" },
    { market: "JP", kind: "gainers" },
    { market: "JP", kind: "losers" }
  ].freeze

  def perform(limit: 20)
    fetched_at = Time.current
    fetcher = YahooFinance::CriteriaScreenerFetcher.new

    quotes_by_symbol = {}

    SCREENS.each do |s|
      quotes = fetcher.call(market: s[:market], kind: s[:kind], limit: limit)

      YahooFinance::ScreenerRankingsUpserter.new(
        market: s[:market],
        kind: s[:kind],
        quotes: quotes,
        fetched_at: fetched_at,
        limit: limit
      ).call

      quotes.first(limit).each do |q|
        sym = q["symbol"]
        next if sym.blank?

        if s[:kind] == "market_cap"
          quotes_by_symbol[sym] = q
        else
          quotes_by_symbol[sym] ||= q
        end
      end
    end

    YahooFinance::SnapshotUpserterFromQuotes
      .new(quotes: quotes_by_symbol.values, fetched_at: fetched_at)
      .call
  end
end