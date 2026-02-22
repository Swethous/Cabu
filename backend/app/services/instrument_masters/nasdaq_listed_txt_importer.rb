# frozen_string_literal: true

require "csv"

module InstrumentMasters
  class NasdaqListedTxtImporter
    PROVIDER = "NASDAQ_LISTED"
    EXCHANGE = "NASDAQ"

    # 파일 헤더:
    # Symbol|Security Name|Market Category|Test Issue|Financial Status|Round Lot Size|ETF|NextShares
    REQUIRED_HEADERS = [ "Symbol", "Security Name", "ETF" ].freeze

    def call(path:)
      raise ArgumentError, "TXT not found: #{path}" unless File.exist?(path)

      now = Time.current
      rows = []

      # nasdaqlisted.txt는 '|' 구분자
      csv = CSV.read(path, headers: true, col_sep: "|", encoding: "bom|utf-8")
      validate_headers!(csv.headers)

      csv.each_with_index do |r, idx|
        sym = r["Symbol"]&.strip
        name = r["Security Name"]&.strip
        etf_flag = r["ETF"]&.strip # "Y" or "N"

        # 마지막 줄에 File Creation Time 같은 메타가 들어있는 경우가 있어서 방어
        next if sym.blank? || name.blank?
        next if sym.casecmp("File Creation Time").zero?

        security_type = (etf_flag == "Y") ? "ETF" : "EQUITY"

        rows << {
          provider: PROVIDER,
          provider_symbol: sym,
          symbol: sym,

          name_en: name,
          name_jp: nil,

          exchange: EXCHANGE,
          security_type: security_type,
          jpx_section: nil,

          is_active: true,
          created_at: now,
          updated_at: now
        }
      rescue => e
        Rails.logger.warn("[NASDAQ Import] skip row idx=#{idx} err=#{e.class}: #{e.message}")
        next
      end

      return { upserted: 0, path: path } if rows.empty?

      InstrumentMaster.upsert_all(
        rows,
        unique_by: :index_instrument_masters_on_provider_and_provider_symbol
      )

      { upserted: rows.size, path: path }
    end

    private

    def validate_headers!(headers)
      missing = REQUIRED_HEADERS - headers
      return if missing.empty?
      raise ArgumentError, "NASDAQ listed txt missing headers: #{missing.join(', ')}"
    end
  end
end
