# frozen_string_literal: true

module YahooFinance
  class SnapshotUpserterFromQuotes
    CHANGE_PERCENT_ABS_LIMIT = 1000

    def initialize(quotes:, fetched_at:)
      @quotes = Array(quotes)
      @fetched_at = fetched_at
    end

    def call
      return { snapshots: 0 } if @quotes.empty?

      now = Time.current

      symbols = @quotes.map { |q| q["symbol"] }.compact.uniq
      symbol_to_id = Stock.where(yahoo_symbol: symbols).pluck(:yahoo_symbol, :id).to_h
      stock_id_to_currency = Stock.where(id: symbol_to_id.values).pluck(:id, :currency).to_h

      has_snapshot_date = StockSnapshot.column_names.include?("snapshot_date")
      snapshot_date = @fetched_at.to_date if has_snapshot_date

      rows = @quotes.filter_map do |q|
        sym = q["symbol"]
        stock_id = symbol_to_id[sym]
        next unless stock_id

        currency = q["currency"].presence || stock_id_to_currency[stock_id]

        raw_cp = q["regularMarketChangePercent"]
        cp =
          begin
            v = raw_cp.nil? ? nil : raw_cp.to_d
            v && v.abs >= CHANGE_PERCENT_ABS_LIMIT ? nil : v
          rescue StandardError
            nil
          end

        row = {
          stock_id: stock_id,
          price: q["regularMarketPrice"],
          prev_close: q["regularMarketPreviousClose"],
          change_percent: cp, # ✅ 여기서 정리
          market_cap: q["marketCap"],
          currency: currency,
          as_of: q["as_of"],
          fetched_at: @fetched_at,
          created_at: now,
          updated_at: now
        }

        row[:snapshot_date] = snapshot_date if has_snapshot_date
        row
      end

      return { snapshots: 0 } if rows.empty?

      unique_by =
        if has_snapshot_date
          :index_stock_snapshots_on_stock_id_and_snapshot_date
        else
          :index_stock_snapshots_on_stock_id
        end

      StockSnapshot.upsert_all(rows, unique_by: unique_by)
      { snapshots: rows.size }
    end
  end
end
