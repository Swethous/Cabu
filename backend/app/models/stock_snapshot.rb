class StockSnapshot < ApplicationRecord
  belongs_to :stock

  validates :fetched_at, presence: true
end