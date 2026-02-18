class Api::V1::PasswordResetsController < ApplicationController
  skip_before_action :authenticate_user!, only: [:create, :update]

  GENERIC_MESSAGE = "If your email exists in our system, password reset instructions have been sent.".freeze

  # POST /api/v1/password_resets
  def create
    email = params[:email].to_s.strip.downcase

    if email.present?
      user = User.find_by(email: email)
      send_password_reset_email(user) if user
    end

    render json: { message: GENERIC_MESSAGE }, status: :ok
  end

  # PATCH /api/v1/password_resets
  def update
    token = params[:token].to_s
    password = params[:password].to_s

    if token.blank? || password.blank?
      return render json: { error: "token and password are required" }, status: :unprocessable_entity
    end

    user = User.find_by_valid_password_reset_token(token)
    return render_invalid_token_error unless user

    user.password = password
    user.password_confirmation = params[:password_confirmation] if params.key?(:password_confirmation)

    if user.save
      user.clear_password_reset_token!
      render json: { message: "Password has been reset successfully." }, status: :ok
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def send_password_reset_email(user)
    token = user.issue_password_reset_token!
    PasswordResetMailer.with(user: user, token: token).reset_password.deliver_later
  rescue StandardError => e
    Rails.logger.error("[PasswordReset] failed to send email user_id=#{user.id} error=#{e.class}: #{e.message}")
  end

  def render_invalid_token_error
    render json: { error: "Invalid or expired token" }, status: :unprocessable_entity
  end
end
