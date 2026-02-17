class Api::V1::GoogleAuthController < ApplicationController
  skip_before_action :authenticate_user!, only: [:create]

  # POST /api/v1/auth/google
  def create
    id_token = params[:id_token].to_s
    nonce = params[:nonce].to_s.presence

    if id_token.blank?
      return render json: { error: "id_token is required" }, status: :bad_request
    end

    audience = ENV["GOOGLE_OIDC_CLIENT_ID"].to_s
    if audience.blank?
      Rails.logger.error("[GoogleAuth] GOOGLE_OIDC_CLIENT_ID is missing")
      return render json: { error: "Google auth is not configured" }, status: :internal_server_error
    end

    payload = GoogleIdTokenVerifier.new(
      id_token: id_token,
      audience: audience,
      nonce: nonce
    ).verify!

    email = payload["email"].to_s.downcase
    verified = ActiveModel::Type::Boolean.new.cast(payload["email_verified"])

    unless verified
      return render json: { error: "Google email is not verified" }, status: :unauthorized
    end
    if email.blank?
      return render json: { error: "Email was not provided by Google" }, status: :unprocessable_entity
    end

    user = find_or_create_google_user!(email: email, payload: payload)
    token = JsonWebToken.encode(user_id: user.id)

    render json: {
      accessToken: token,
      user: serialized_user(user)
    }, status: :ok
  rescue GoogleIdTokenVerifier::VerificationError => e
    render json: { error: "Invalid Google token", detail: e.message }, status: :unauthorized
  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
  end

  private

  def find_or_create_google_user!(email:, payload:)
    user = User.find_or_initialize_by(email: email)

    user.name = payload["name"] if user.name.blank? && payload["name"].present?
    user.avatar_url = payload["picture"] if payload["picture"].present?

    if user.new_record?
      generated_password = "G#{SecureRandom.hex(16)}1"
      user.password = generated_password
      user.password_confirmation = generated_password
    end

    user.save!
    user
  end

  def serialized_user(user)
    {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      role: user.role
    }
  end
end
