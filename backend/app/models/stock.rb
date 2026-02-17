class Stock < ApplicationRecord
  has_many :price_candles, dependent: :destroy
  has_one  :stock_snapshot, dependent: :destroy

  has_many :posts, dependent: :destroy
  has_many :bookmarks, dependent: :destroy

  validates :yahoo_symbol, presence: true, uniqueness: true
end