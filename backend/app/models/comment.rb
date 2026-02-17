class Comment < ApplicationRecord
  belongs_to :user
  belongs_to :post, counter_cache: true # 댓글 수 카운터 캐시

  has_many :comment_likes, dependent: :destroy

  validates :body, presence: true, length: { maximum: 1000 }
end