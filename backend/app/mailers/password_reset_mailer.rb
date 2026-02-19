class PasswordResetMailer < ApplicationMailer
  def reset_password
    @user = params[:user]
    token = params[:token].to_s
    @reset_url = "#{frontend_base_url}/reset-password?token=#{URI.encode_www_form_component(token)}"

    mail(
      to: @user.email,
      subject: "[Cabu] パスワード再設定のご案内"
    )
  end

  private

  def frontend_base_url
    ENV["FRONTEND_APP_URL"].presence ||
      ENV["FRONTEND_BASE_URL"].presence ||
      "http://localhost:3001"
  end
end
