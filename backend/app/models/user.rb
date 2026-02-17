class User < ApplicationRecord
  before_create :set_default_role

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
            length: { minimum: 6 },
            format: { with: VALID_PASSWORD_REGEX },
            if: :password_required?

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
end
