# frozen_string_literal: true

require "cgi"

module YahooFinance
  class ChartFetcher
    def initialize(client: Client.new)
      @client = client
    end

    # range: "1mo", interval: "1d" 같은 값
    def call(symbol:, range:, interval:)
      body = @client.get(
        "/v8/finance/chart/#{CGI.escape(symbol)}",
        params: { range: range, interval: interval }
      )
      return nil unless body

      body.dig("chart", "result")&.first
    end
  end
end