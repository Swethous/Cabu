# frozen_string_literal: true

require "faraday"
require "json"
require "faraday-cookie_jar"
require "faraday/follow_redirects"
require "http/cookie_jar"

module YahooFinance
  class Client
    BASE_URL   = "https://query1.finance.yahoo.com".freeze
    PREFLIGHT  = "https://fc.yahoo.com".freeze
    REFERER    = "https://finance.yahoo.com/".freeze
    USER_AGENT = "Mozilla/5.0".freeze

    def initialize
      @jar = HTTP::CookieJar.new
      @crumb = nil
      @crumb_fetched_at = nil

      @conn = Faraday.new(url: BASE_URL) do |f|
        f.response :follow_redirects
        f.use :cookie_jar, jar: @jar
        f.request :url_encoded
        f.adapter Faraday.default_adapter
        f.options.timeout = 10
        f.options.open_timeout = 5
      end
    end

    def crumb
      ensure_crumb!
      @crumb
    end

    def get(path, params: {}, with_crumb: true)
      ensure_crumb! if with_crumb

      p = params.dup
      p[:crumb] = @crumb if with_crumb && @crumb.present? && !p.key?(:crumb)

      res = @conn.get(path) do |req|
        req.params.update(p)
        set_common_headers(req)
      end

      raise "Yahoo API error status=#{res.status}" unless res.success?
      JSON.parse(res.body)
    rescue Faraday::Error => e
      Rails.logger.error("[YahooFinance::Client] Faraday error: #{e.class} #{e.message}")
      nil
    rescue JSON::ParserError => e
      Rails.logger.error("[YahooFinance::Client] JSON parse error: #{e.message}")
      nil
    end

    def post(path, params: {}, body: {}, with_crumb: true)
      ensure_crumb! if with_crumb

      p = params.dup
      p[:crumb] = @crumb if with_crumb && @crumb.present? && !p.key?(:crumb)

      res = @conn.post(path) do |req|
        req.params.update(p)
        set_common_headers(req)
        req.headers["Content-Type"] = "application/json"
        req.body = JSON.generate(body)
      end

      raise "Yahoo API error status=#{res.status}" unless res.success?
      JSON.parse(res.body)
    rescue Faraday::Error => e
      Rails.logger.error("[YahooFinance::Client] Faraday error: #{e.class} #{e.message}")
      nil
    rescue JSON::ParserError => e
      Rails.logger.error("[YahooFinance::Client] JSON parse error: #{e.message}")
      nil
    end

    private

    def ensure_crumb!
      return if @crumb.present? && @crumb_fetched_at && @crumb_fetched_at > 30.minutes.ago

      # 1) preflight: 쿠키 받기
      @conn.get(PREFLIGHT) { |req| set_html_headers(req) }

      # 2) crumb: 문자열로 내려와야 정상
      r = @conn.get("/v1/test/getcrumb") do |req|
        req.headers["User-Agent"] = USER_AGENT
        req.headers["Referer"] = REFERER
      end

      body = r.body.to_s.strip
      if r.success? && body.present? && !body.start_with?("{")
        @crumb = body
        @crumb_fetched_at = Time.current
      else
        Rails.logger.error("[YahooFinance::Client] crumb fetch failed status=#{r.status} body=#{body[0,120]}")
        @crumb = nil
      end
    end

    def set_common_headers(req)
      req.headers["User-Agent"] = USER_AGENT
      req.headers["Referer"] = REFERER
      req.headers["Accept"] = "application/json,text/plain,*/*"
      req.headers["Accept-Language"] = "en-US,en;q=0.9"
    end

    def set_html_headers(req)
      req.headers["User-Agent"] = USER_AGENT
      req.headers["Accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      req.headers["Accept-Language"] = "en-US,en;q=0.9"
    end
  end
end