# app/services/yahoo_finance/candle_points_builder.rb
# yahoo refult > DB row 배열 변환기

module YahooFinance
  class CandlePointsBuilder
    def call(result:, stock_id:, interval:, fetched_at:)
      return [] if result.blank?

      timestamps = result["timestamp"] || []
      quote      = result.dig("indicators", "quote", 0) || {}

      opens  = quote["open"]   || []
      highs  = quote["high"]   || []
      lows   = quote["low"]    || []
      closes = quote["close"]  || []
      vols   = quote["volume"] || []

      now = Time.current

      rows = []
      timestamps.each_with_index do |ts, i|
        next if ts.nil?

        # close가 nil이면 캔들로 의미 없어서 스킵(휴장/결측)
        close = closes[i]
        next if close.nil?

        rows << {
          stock_id:  stock_id,
          ts:        Time.at(ts).utc,
          interval:  interval,
          open:      opens[i],
          high:      highs[i],
          low:       lows[i],
          close:     close,
          volume:    (vols[i] || 0),
          fetched_at: fetched_at,
          created_at: now,
          updated_at: now
        }
      end

      rows
    end
  end
end