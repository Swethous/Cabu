class Api::V1::Charts::StocksController < ApplicationController
  skip_before_action :authenticate_user!

  def show
    symbol   = params[:symbol].presence   || "7203.T"
    range    = params[:range].presence    || "1mo"
    interval = params[:interval].presence || "1d"

    data = YahooFinance::CandleChartService.new(
      symbol: symbol,
      range: range,
      interval: interval
    ).call

    render json: data
  rescue => e
    Rails.logger.error("[Api::V1::Charts::StocksController#show] #{e.class}: #{e.message}")
    render json: { error: "Failed to fetch stock chart" }, status: :bad_request
  end
end