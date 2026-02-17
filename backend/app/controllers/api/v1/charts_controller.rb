# frozen_string_literal: true

class Api::V1::ChartsController < ApplicationController
  skip_before_action :authenticate_user!, only: [:show]

    def show
    payload = YahooFinance::ChartClient.fetch_chart!(
        symbol: params[:symbol],
        mode: (params[:mode].presence || "daily"),
        interval: params[:interval]
    )
    render json: payload
    end
end