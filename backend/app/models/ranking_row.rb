class RankingRow < ApplicationRecord
  belongs_to :stock

  validates :market, presence: true
  validates :kind, presence: true
  validates :rank, presence: true
end