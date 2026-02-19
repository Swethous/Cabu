class Post < ApplicationRecord
    BODY_MAX_LENGTH = 500

    belongs_to :user
    belongs_to :stock

    has_many :comments, dependent: :destroy
    has_many :post_likes, dependent: :destroy

    validates :body,
              presence: true,
              length: {
                maximum: BODY_MAX_LENGTH,
                too_long: "は%{count}文字以内で入力してください"
              }
    validates :image_url, length: { maximum: 1000 }, allow_blank: true
end
