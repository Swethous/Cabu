class User < ApplicationRecord
  RESET_PASSWORD_TOKEN_TTL = 30.minutes
  DEFAULT_AVATAR_PATHS = (1..8).map { |n| format("/avatars/avatar_%<num>02d.png", num: n) }.freeze

  before_create :set_default_role
  before_validation :assign_random_default_avatar, on: :create

  has_many :posts, dependent: :destroy
  has_many :comments, dependent: :destroy
  has_many :bookmarks, dependent: :destroy
  has_many :contact_inquiries, dependent: :nullify

  has_secure_password

  # =========================
  # 유효성 검사용 정규식
  # =========================

  # 이메일 형식 검증용 (Rails 기본 제공)
  VALID_EMAIL_REGEX = URI::MailTo::EMAIL_REGEXP

  # 비밀번호: 영문 + 숫자 조합 최소 1개 이상 포함
  VALID_PASSWORD_REGEX = /\A(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+\z/

  # =========================
  # 이메일 유효성 검사
  # =========================
  validates :email,
            presence: true,
            uniqueness: true,
            format: { with: VALID_EMAIL_REGEX }

  # =========================
  # 비밀번호 유효성 검사
  # =========================
  # 조건:
  # 1. 최소 6자
  # 2. 영문 + 숫자 조합
  # 3. 새 유저 생성 또는 비밀번호 변경 시에만 검증
  validates :password,
            length: {
              minimum: 6,
              too_short: "は6文字以上で入力してください"
            },
            format: {
              with: VALID_PASSWORD_REGEX,
              message: "は英字と数字をそれぞれ1文字以上含めてください"
            },
            if: :password_required?

  def issue_password_reset_token!
    raw_token = SecureRandom.urlsafe_base64(32)

    update!(
      reset_password_token_digest: self.class.digest_password_reset_token(raw_token),
      reset_password_sent_at: Time.current
    )

    raw_token
  end

  def valid_password_reset_token?(token)
    return false if token.blank?
    return false if reset_password_token_digest.blank? || reset_password_sent_at.blank?
    return false if reset_password_sent_at < RESET_PASSWORD_TOKEN_TTL.ago

    candidate = self.class.digest_password_reset_token(token)
    ActiveSupport::SecurityUtils.secure_compare(reset_password_token_digest, candidate)
  rescue StandardError
    false
  end

  def clear_password_reset_token!
    update_columns(
      reset_password_token_digest: nil,
      reset_password_sent_at: nil,
      updated_at: Time.current
    )
  end

  def self.find_by_valid_password_reset_token(token)
    return nil if token.blank?

    digest = digest_password_reset_token(token)
    user = find_by(reset_password_token_digest: digest)
    return nil unless user&.valid_password_reset_token?(token)

    user
  end

  def self.digest_password_reset_token(token)
    secret = Rails.application.secret_key_base
    OpenSSL::HMAC.hexdigest("SHA256", secret, token.to_s)
  end

  private

  # =========================
  # 비밀번호 검증이 필요한 순간
  # =========================
  # - 새 유저 생성 시 (password_digest 비어 있음)
  # - 기존 유저가 password 필드 보낼 때 (비밀번호 변경)
  def password_required?
    password_digest.blank? || !password.nil?
  end

  def set_default_role
    self.role ||= "member"
  end

  def assign_random_default_avatar
    return if avatar_url.present?

    self.avatar_url = DEFAULT_AVATAR_PATHS.sample
  end
end
