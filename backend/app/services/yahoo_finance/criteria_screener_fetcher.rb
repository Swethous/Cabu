# frozen_string_literal: true

module YahooFinance
  class CriteriaScreenerFetcher
    def initialize(client: Client.new)
      @client = client
    end

    # market: "US" / "JP"
    # kind: "market_cap" / "gainers" / "losers"
    def call(market:, kind:, limit:, offset: 0)
      market_lc = market.to_s.downcase # "us" / "jp"

      params = {
        formatted: "true",
        useRecordsResponse: "true",
        lang: (market_lc == "jp" ? "ja-JP" : "en-US"),
        region: (market_lc == "jp" ? "JP" : "US"),
        corsDomain: "finance.yahoo.com"
      }

      body = build_body(market_lc: market_lc, kind: kind, limit: limit, offset: offset)

      json = @client.post("/v1/finance/screener", params: params, body: body, with_crumb: true)
      return [] unless json

      result0 = json.dig("finance", "result")&.first
      return [] unless result0

      if result0["records"].present?
        normalize_records(result0["records"], market_lc: market_lc)
      else
        # 혹시 quotes 형태로 올 때는 그대로 반환(여기서는 currency 보정 안 함)
        result0["quotes"] || []
      end
    end

    private

    def build_body(market_lc:, kind:, limit:, offset:)
      sort_field, sort_type =
        case kind.to_s
        when "market_cap" then [ "intradaymarketcap", "DESC" ]
        when "gainers"    then [ "percentchange", "DESC" ]
        when "losers"     then [ "percentchange", "ASC" ]
        else
          raise ArgumentError, "unknown kind=#{kind.inspect}"
        end

      # 최소 시가총액 필터 (허수 제거)
      min_market_cap = case market_lc
      when "us" then 100_000_000      # $100M
      when "jp" then 5_000_000_000    # ¥5B
      else 0
      end

      operands = [
        { operator: "EQ", operands: [ "region", market_lc ] }
      ]

      # 시가총액 필터 추가 (min_market_cap > 0일 때만)
      if min_market_cap > 0
        operands << { operator: "GT", operands: [ "intradaymarketcap", min_market_cap ] }
      end

      {
        size: limit,
        offset: offset,
        sortField: sort_field,
        sortType: sort_type,
        quoteType: "EQUITY",
        topOperator: "AND",
        query: {
          operator: "AND",
          operands: operands
        }
      }
    end

    def raw(v)
      v.is_a?(Hash) ? v["raw"] : v
    end

    def default_currency(market_lc)
      market_lc == "jp" ? "JPY" : "USD"
    end

    # records 응답(웹에서 본 형태)을 우리 코드에서 쓰기 좋은 형태로 최소한만 평탄화
    def normalize_records(records, market_lc:)
      Array(records).filter_map do |r|
        sym = r["ticker"] || r["symbol"]
        next if sym.blank?

        t = raw(r["regularMarketTime"]) # epoch seconds

        currency =
          (r["quotesCurrency"] || r["financialCurrency"] || r["currency"]).presence ||
          default_currency(market_lc)

        {
          "symbol" => sym,
          "shortName" => (r["companyName"] || r["shortName"] || r["longName"]),
          "regularMarketPrice" => raw(r["regularMarketPrice"]),
          "regularMarketPreviousClose" => raw(r["regularMarketPreviousClose"]),
          "regularMarketChangePercent" => raw(r["regularMarketChangePercent"]),
          "regularMarketTime" => t,
          "as_of" => (t.present? ? Time.at(t).utc : nil),
          "marketCap" => raw(r["marketCap"]),
          "currency" => currency, # ✅ 절대 nil 안 됨
          "_raw" => r
        }
      end
    end
  end
end
