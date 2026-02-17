# app/services/yahoo_finance/upsert_price_candles.rb
# price_candles 테이블에 대량 upsert

module YahooFinance
  class UpsertPriceCandles
    UNIQUE_INDEX = :index_price_candles_on_stock_id_interval_ts_unique

    def call(rows:)
      return 0 if rows.blank?

      # upsert_all은 validation/콜백 안 탐 (배치에 유리)
      result = PriceCandle.upsert_all(rows, unique_by: UNIQUE_INDEX)
      # Rails 버전에 따라 result.rows 없을 수 있어서 count는 rows.size로 처리
      rows.size
    end
  end
end