require "json"
require "net/http"

class GoogleIdTokenVerifier
  GOOGLE_ISSUERS = [ "https://accounts.google.com", "accounts.google.com" ].freeze
  GOOGLE_JWKS_URI = URI("https://www.googleapis.com/oauth2/v3/certs")
  CACHE_KEY = "google_oidc_jwks"

  VerificationError = Class.new(StandardError)

  def initialize(id_token:, audience:, nonce: nil)
    @id_token = id_token
    @audience = audience
    @nonce = nonce
  end

  def verify!
    payload, = JWT.decode(
      @id_token,
      nil,
      true,
      algorithms: [ "RS256" ],
      verify_iss: true,
      iss: GOOGLE_ISSUERS,
      verify_aud: true,
      aud: @audience,
      verify_iat: true,
      verify_expiration: true,
      jwks: jwks_loader
    )

    verify_nonce!(payload)
    payload
  rescue JWT::DecodeError, JWT::VerificationError, JWT::ExpiredSignature => e
    raise VerificationError, e.message
  end

  private

  def verify_nonce!(payload)
    return if @nonce.blank?

    token_nonce = payload["nonce"].to_s
    raise VerificationError, "Invalid nonce" if token_nonce.blank? || token_nonce != @nonce
  end

  def jwks_loader
    lambda do |options|
      options ||= {}
      force_refresh = options[:invalidate] || options[:kid_not_found]

      Rails.cache.fetch(CACHE_KEY, expires_in: 12.hours, force: force_refresh) do
        response = Net::HTTP.get_response(GOOGLE_JWKS_URI)
        unless response.is_a?(Net::HTTPSuccess)
          raise VerificationError, "Failed to fetch Google JWK set"
        end

        JSON.parse(response.body)
      end
    rescue JSON::ParserError, SocketError, SystemCallError, Timeout::Error
      raise VerificationError, "Invalid Google JWK response"
    end
  end
end
