# app/services/http/yahoo_client.rb
require "faraday"

module Http
  class YahooClient
    BASE_URL = "https://query1.finance.yahoo.com".freeze

    def self.connection
      @connection ||= Faraday.new(url: BASE_URL) do |f|
        # 응답이 JSON이면 자동으로 파싱해줌 (Hash로 옴)
        f.response :json, content_type: /\bjson$/

        # 타임아웃 설정 (원하면 조절)
        f.options.timeout = 5        # 응답 대기 시간
        f.options.open_timeout = 2   # 연결 시도 시간

        f.adapter Faraday.default_adapter
      end
    end
  end
end