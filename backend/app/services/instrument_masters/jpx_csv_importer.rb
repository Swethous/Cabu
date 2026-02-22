# frozen_string_literal: true

require "csv"

module InstrumentMasters
  class JpxCsvImporter
    PROVIDER = "JPX"
    EXCHANGE = "TSE" # 표준화: JPX(운영기관) / TSE(거래소). 우리 필드는 exchange라서 TSE로 고정 추천.

    # JPX 市場・商品区分(10개) -> (security_type, jpx_section)
    SECTION_MAP = {
    "プライム（内国株式）" => [ "EQUITY", "PRIME" ],
    "スタンダード（内国株式）" => [ "EQUITY", "STANDARD" ],
    "グロース（内国株式）" => [ "EQUITY", "GROWTH" ],

    "プライム（外国株式）" => [ "EQUITY", "PRIME" ],
    "スタンダード（外国株式）" => [ "EQUITY", "STANDARD" ],
    "グロース（外国株式）" => [ "EQUITY", "GROWTH" ],

    "PRO Market" => [ "EQUITY", nil ],

    "ETF・ETN" => [ "ETF", nil ],
    "REIT・ベンチャーファンド・カントリーファンド・インフラファンド" => [ "REIT", nil ],
    "出資証券" => [ "PS", nil ]
    }.freeze

    # CSV 헤더(일본어) 예:
    # コード, 銘柄名, 市場・商品区分, 33業種コード, 33業種区分, 17業種コード, 17業種区分, 規模コード, 規模区分
    REQUIRED_HEADERS = [ "コード", "銘柄名", "市場・商品区分" ].freeze

    def call(path:)
      raise ArgumentError, "CSV not found: #{path}" unless File.exist?(path)

      rows = []
      now = Time.current

      csv = CSV.read(path, headers: true, encoding: "bom|utf-8")
      validate_headers!(csv.headers)

      csv.each_with_index do |r, idx|
        code = r["コード"]&.strip
        name = r["銘柄名"]&.strip
        section_label = r["市場・商品区分"]&.strip

        next if code.blank? || name.blank? || section_label.blank?

        security_type, jpx_section = map_section(section_label)

        # JPX 코드를 Yahoo 표준 심볼(.T)로 만들기: 7203 -> 7203.T
        symbol = "#{code}.T"

        rows << {
          provider: PROVIDER,
          provider_symbol: code,
          symbol: symbol,

          name_jp: name,
          name_en: nil, # JPX 파일엔 보통 영문명 없으니 비워두고, 필요하면 후에 보강

          exchange: EXCHANGE,
          security_type: security_type,
          jpx_section: jpx_section,

          is_active: true,
          created_at: now,
          updated_at: now
        }
      rescue => e
        # 한 줄이 깨져도 전체 중단 안 시키고 로그 남기기
        Rails.logger.warn("[JPX Import] skip row idx=#{idx} err=#{e.class}: #{e.message}")
        next
      end

      return { inserted: 0, path: path } if rows.empty?

      # Rails 7+ upsert_all
      ::InstrumentMaster.upsert_all(
        rows,
        unique_by: :index_instrument_masters_on_provider_and_provider_symbol
      )

      { inserted: rows.size, path: path }
    end

    private

    def validate_headers!(headers)
      missing = REQUIRED_HEADERS - headers
      return if missing.empty?
      raise ArgumentError, "JPX CSV missing headers: #{missing.join(', ')}"
    end

    def map_section(label)
      mapped = SECTION_MAP[label]
      return mapped if mapped

      # 예상 밖 값이 들어오면 일단 보수적으로
      Rails.logger.warn("[JPX Import] unknown 市場・商品区分=#{label.inspect} -> fallback")
      [ "UNKNOWN", label ]
    end
  end
end
