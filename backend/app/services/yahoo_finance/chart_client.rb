# frozen_string_literal: true

require "net/http"
require "json"

module YahooFinance
  class ChartClient
    class BadRequest < StandardError; end
    class UpstreamError < StandardError; end

    BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart"

    MODES = %w[intraday daily weekly monthly yearly].freeze
    INTRADAY_INTERVALS = %w[5m 15m 30m 60m].freeze
    INTRADAY_RANGES = {
      "5m" => "2d",
      "15m" => "3d",
      "30m" => "5d",
      "60m" => "5d"
    }.freeze

    UP_COLOR   = "#F04452"
    DOWN_COLOR = "#2F6FED"

    # mode:
    # - intraday: interval별 range
    #   - 5m:  2d
    #   - 15m: 3d
    #   - 30m: 5d
    #   - 60m: 5d
    # - daily:    range=1y   interval=1d
    # - weekly:   range=4y   interval=1wk
    # - monthly:  range=10y  interval=1mo
    # - yearly:   range=max  interval=1mo  => 서버에서 연봉 집계
    def self.fetch_chart!(symbol:, mode:, interval: nil)
      symbol = symbol.to_s.strip
      raise BadRequest, "symbol is required" if symbol.empty?

      mode = mode.to_s
      raise BadRequest, "mode must be one of: #{MODES.join(', ')}" unless MODES.include?(mode)

      range, resolved_interval =
        case mode
        when "intraday"
          i = (interval.presence || "5m").to_s
          raise BadRequest, "interval must be one of: #{INTRADAY_INTERVALS.join(', ')}" unless INTRADAY_INTERVALS.include?(i)
          [ INTRADAY_RANGES.fetch(i), i ]
        when "daily"
          [ "1y", "1d" ]
        when "weekly"
          [ "4y", "1wk" ]
        when "monthly"
          [ "10y", "1mo" ]
        when "yearly"
          [ "max", "1mo" ]
        end

      # ✅ 차트 데이터(core)만 캐시: 표시명 변경은 바로 반영되게 캐시 밖에서 합성
      core_key = "yahoo:chart:core:v1:#{symbol}:#{mode}:#{range}:#{resolved_interval}"
      core_ttl = cache_ttl(mode)

      core = Rails.cache.fetch(core_key, expires_in: core_ttl) do
        raw = fetch_raw!(symbol: symbol, range: range, interval: resolved_interval)
        normalized = normalize!(raw, symbol: symbol, mode: mode, range: range, interval: resolved_interval)
        mode == "yearly" ? aggregate_yearly!(normalized) : normalized
      end

      # ✅ 1) override 우선
      override_ja = StockNameOverrides.ja(symbol)

      # ✅ 2) override 없으면 Wikidata (자체 캐시)
      names =
        if override_ja.present?
          { ja: override_ja }
        else
          Wikidata::NameResolver.resolve(symbol: symbol)
        end

      # ✅ 최종 라벨 (JP: 日本語(ブランド) / US: 日本語(SYMBOL))
      display_label = StockDisplayLabel.build(symbol: symbol, names: names, meta_name: core[:metaName])

      core.merge(
        names: names,
        displayLabel: display_label
      )
    end

    def self.cache_ttl(mode)
      case mode
      when "intraday" then 5.minutes
      when "daily"    then 10.minutes
      when "weekly"   then 30.minutes
      when "monthly"  then 60.minutes
      when "yearly"   then 2.hours
      else 30.seconds
      end
    end

    def self.fetch_raw!(symbol:, range:, interval:)
      uri = URI("#{BASE_URL}/#{URI.encode_www_form_component(symbol)}")
      uri.query = URI.encode_www_form(range: range, interval: interval, includePrePost: false)

      req = Net::HTTP::Get.new(uri)
      req["User-Agent"] = "Mozilla/5.0"
      req["Accept"] = "application/json"

      res = Net::HTTP.start(
        uri.host, uri.port,
        use_ssl: true,
        open_timeout: 3,
        read_timeout: 8
      ) { |http| http.request(req) }

      raise UpstreamError, "Yahoo response #{res.code}" unless res.is_a?(Net::HTTPSuccess)
      JSON.parse(res.body)
    rescue JSON::ParserError
      raise UpstreamError, "Yahoo returned invalid JSON"
    end

    def self.normalize!(json, symbol:, mode:, range:, interval:)
      error  = json.dig("chart", "error")
      result = json.dig("chart", "result", 0)
      raise UpstreamError, (error&.dig("description") || "Yahoo chart error") if result.nil?

      meta = result["meta"] || {}
      meta_name = {
        short: meta["shortName"],
        long:  meta["longName"]
      }

      timestamps = result["timestamp"] || []
      quote  = result.dig("indicators", "quote", 0) || {}
      opens  = quote["open"]  || []
      highs  = quote["high"]  || []
      lows   = quote["low"]   || []
      closes = quote["close"] || []
      vols   = quote["volume"] || []

      candles = []
      volumes = []

      timestamps.each_with_index do |t, i|
        o, h, l, c = opens[i], highs[i], lows[i], closes[i]
        v = vols[i]
        next if [ o, h, l, c ].any?(&:nil?)

        up = c.to_f >= o.to_f
        bar_color = up ? UP_COLOR : DOWN_COLOR

        candles << {
          time: t,
          open: o.to_f,
          high: h.to_f,
          low:  l.to_f,
          close: c.to_f,
          color: bar_color,
          borderColor: bar_color,
          wickColor: bar_color
        }

        volumes << { time: t, value: v.to_i, color: bar_color } if !v.nil?
      end

      {
        symbol: symbol,
        mode: mode,
        range: range,
        interval: interval,
        metaName: meta_name,
        metaMarket: {
          currency: meta["currency"],
          exchangeName: meta["exchangeName"],
          fullExchangeName: meta["fullExchangeName"],
          timezone: meta["timezone"],
          exchangeTimezoneName: meta["exchangeTimezoneName"]
        },
        candles: candles,
        volumes: volumes
      }
    end

    # 월/일 데이터를 연 단위 OHLCV로 집계
    def self.aggregate_yearly!(payload)
      candles = payload[:candles]
      vols    = payload[:volumes]

      by_year = {}

      candles.each do |c|
        y = Time.at(c[:time]).utc.year
        by_year[y] ||= { candles: [], volumes: [] }
        by_year[y][:candles] << c
      end

      vols.each do |v|
        y = Time.at(v[:time]).utc.year
        by_year[y] ||= { candles: [], volumes: [] }
        by_year[y][:volumes] << v
      end

      years = by_year.keys.sort
      out_candles = []
      out_volumes = []

      years.each do |y|
        cs = by_year[y][:candles]
        next if cs.empty?

        cs.sort_by! { |x| x[:time] }
        open  = cs.first[:open]
        close = cs.last[:close]
        high  = cs.map { |x| x[:high] }.max
        low   = cs.map { |x| x[:low] }.min

        up = close.to_f >= open.to_f
        color = up ? UP_COLOR : DOWN_COLOR

        t = cs.first[:time]

        out_candles << {
          time: t, open: open, high: high, low: low, close: close,
          color: color, borderColor: color, wickColor: color
        }

        vs = by_year[y][:volumes]
        sum_v = vs.map { |x| x[:value].to_i }.sum
        out_volumes << { time: t, value: sum_v, color: color } if sum_v > 0
      end

      payload.merge(mode: "yearly", interval: "1y", candles: out_candles, volumes: out_volumes)
    end

    private_class_method :cache_ttl, :fetch_raw!, :normalize!, :aggregate_yearly!
  end
end
