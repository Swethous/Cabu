# app/services/yahoo_finance/index_chart_service.rb
# legacy
require "faraday"
require "json"
require "cgi"

module YahooFinance
  class IndexChartService
    BASE_URL = "https://query1.finance.yahoo.com".freeze

    IndexConfig = Struct.new(:id, :symbol, :name_ja, :name_en, :currency, keyword_init: true)

    INDICES = [
      IndexConfig.new(
        id: "usdjpy",
        symbol: "USDJPY=X",
        name_ja: "ドル円",
        name_en: "USD/JPY",
        currency: "JPY" # 값이 'JPY per USD'라서 표시용으론 JPY로 두는 게 무난
      ),
      IndexConfig.new(
        id: "sp500",
        symbol: "^GSPC",
        name_ja: "S&P500",
        name_en: "S&P 500",
        currency: "USD"
      ),
      IndexConfig.new(
        id: "nasdaq",
        symbol: "^IXIC",
        name_ja: "NASDAQ総合",
        name_en: "NASDAQ Composite",
        currency: "USD"
      ),
      IndexConfig.new(
        id: "nikkei225",
        symbol: "^N225",
        name_ja: "日経平均株価",
        name_en: "Nikkei 225",
        currency: "JPY"
      )
    ].freeze

    def initialize(range: "1mo", interval: "1d")
      @range    = range
      @interval = interval
    end

    def call
      INDICES.map do |idx|
        result = fetch_chart(idx.symbol)

        {
          id:       idx.id,
          symbol:   idx.symbol,
          name_ja:  idx.name_ja,
          name_en:  idx.name_en,
          currency: idx.currency,
          range:    @range,
          interval: @interval,
          points:   build_points(result)
        }
      end
    end

    private

    def fetch_chart(symbol)
      conn = Faraday.new(url: BASE_URL)

      res = conn.get(
        "/v8/finance/chart/#{CGI.escape(symbol)}",
        {
          range: @range,
          interval: @interval
        }
      )

      Rails.logger.info("[IndexChartService] Yahoo status=#{res.status}")

      unless res.success?
        raise "Yahoo API error: status=#{res.status}"
      end

      body = JSON.parse(res.body)
      body.dig("chart", "result")&.first || {}
    rescue Faraday::Error => e
      Rails.logger.error("[IndexChartService] Faraday error: #{e.class} #{e.message}")
      {}
    rescue JSON::ParserError => e
      Rails.logger.error("[IndexChartService] JSON parse error: #{e.message}")
      {}
    end

    def build_points(result)
      timestamps = result["timestamp"] || []
      closes     = result.dig("indicators", "quote", 0, "close") || []

      timestamps.each_with_index.filter_map do |ts, i|
        close = closes[i]
        next if ts.nil? || close.nil?

        {
          time:  Time.at(ts).utc.iso8601,
          close: close
        }
      end
    end
  end
end