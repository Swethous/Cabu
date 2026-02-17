# app/controllers/api/v1/charts/indices_controller.rb
class Api::V1::Charts::IndicesController < ApplicationController
  skip_before_action :authenticate_user!
  
  def main
    range    = params[:range].presence    || "1mo"
    interval = params[:interval].presence || "1d"

    indices = YahooFinance::IndexChartService.new(
      range: range,
      interval: interval
    ).call

    render json: { indices: indices }
  rescue => e
    Rails.logger.error("[Api::V1::Charts::IndicesController#main] #{e.class}: #{e.message}")
    render json: { error: "Failed to fetch indices chart" }, status: :bad_request
  end
end