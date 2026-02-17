# app/models/instrument_master.rb
class InstrumentMaster < ApplicationRecord
  self.table_name = "instrument_masters"

  validates :provider, presence: true
  validates :provider_symbol, presence: true
  validates :symbol, presence: true

  # 너가 확정한 최종 enum
  enum :security_type, {
    EQUITY: "EQUITY",
    ETF: "ETF",
    REIT: "REIT",
    PS: "PS",
    OTHER: "OTHER",
  }, prefix: true

  scope :active, -> { where(is_active: true) }
end