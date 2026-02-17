class ContactInquiry < ApplicationRecord
  CATEGORIES = %w[bug_report feature_request account other].freeze
  STATUSES = %w[new in_progress done].freeze

  belongs_to :user, optional: true

  validates :category, presence: true, inclusion: { in: CATEGORIES }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :subject, presence: true, length: { maximum: 200 }
  validates :body, presence: true, length: { maximum: 5000 }
  validates :reply_email, presence: true, length: { maximum: 255 }, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :locale, presence: true, length: { maximum: 10 }
end
