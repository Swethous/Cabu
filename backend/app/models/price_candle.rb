class PriceCandle < ApplicationRecord
  belongs_to :stock

  validates :ts, presence: true
  validates :interval, presence: true
end