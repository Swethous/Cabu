# frozen_string_literal: true

class CreateInstrumentMasters < ActiveRecord::Migration[7.2]
  def change
    create_table :instrument_masters do |t|
      # source/provider (JPX / NASDAQ / NYSE / MANUAL 등)
      t.string :provider, null: false, limit: 30

      # provider 원본 심볼 (JPX: "7203", NASDAQ: "AAPL" 등)
      t.string :provider_symbol, null: false, limit: 50

      # 우리 표준 심볼 (JPX: "7203.T", US: "AAPL" 등)
      t.string :symbol, null: false, limit: 60

      # 공용 이름
      t.string :name_en, limit: 250
      t.string :name_jp, limit: 250

      # 부가 메타 (있으면 필터링/표시에 도움)
      t.string :exchange, limit: 30        # "TSE", "NASDAQ", "NYSE"...
      t.string :security_type, limit: 30   # "EQUITY", "ETF"...

      # JPX 전용
      t.string :jpx_section, limit: 50     # "Prime", "Standard", "Growth" 등

      t.boolean :is_active, null: false, default: true

      t.timestamps null: false
    end

    # 같은 provider 내 provider_symbol 중복 방지
    add_index :instrument_masters,
              [ :provider, :provider_symbol ],
              unique: true,
              name: :index_instrument_masters_on_provider_and_provider_symbol

    # 표준 심볼은 시스템 내 유니크
    add_index :instrument_masters, :symbol, unique: true

    # 관리/필터링 도움용
    add_index :instrument_masters, :provider
    add_index :instrument_masters, :exchange
    add_index :instrument_masters, :is_active
  end
end
