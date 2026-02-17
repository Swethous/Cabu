# app/services/json_web_token.rb
require "jwt"

class JsonWebToken
  SECRET_KEY = Rails.application.credentials.secret_key_base

  def self.encode(payload, exp = 24.hours.from_now)
    payload = payload.dup
    payload[:exp] = exp.to_i
    JWT.encode(payload, SECRET_KEY, "HS256")
  end

  def self.decode(token)
    return nil if token.blank?

    decoded = JWT.decode(token, SECRET_KEY, true, { algorithm: "HS256" })
    decoded[0].with_indifferent_access
  rescue JWT::DecodeError, JWT::ExpiredSignature, JWT::VerificationError
    nil
  end
end