# app/controllers/api/v1/sparklines_controller.rb
# 프론트에서 주식 스파크라인(미니 차트) 데이터 요청 처리

module Api
  module V1
    class SparklinesController < ApplicationController
      skip_before_action :authenticate_user!, only: [:index]

      # GET /api/v1/sparklines?days=30
      def index
        days = (params[:days].presence || 30).to_i
        days = 30 if days <= 0
        cutoff = Time.current - days.days

        stocks = Stock
                   .where(is_active: true, sparkline_enabled: true)
                   .order(:sort_order, :id)

        stock_ids = stocks.pluck(:id)

        candles = PriceCandle
                    .where(stock_id: stock_ids, interval: "1d")
                    .where("ts >= ?", cutoff)
                    .order(:stock_id, :ts)

        candles_by_stock = candles.group_by(&:stock_id)

        render json: {
          days: days,
          items: stocks.map { |s| serialize_stock(s, candles_by_stock[s.id] || []) }
        }
      end

      private

      def serialize_stock(stock, candles)
        {
          id: stock.id,
          yahoo_symbol: stock.yahoo_symbol,
          name: stock.name,
          name_jp: stock.name_jp,
          market: stock.market,
          points: candles.map { |c| { time: c.ts.utc.iso8601, close: c.close&.to_f } }
        }
      end
    end
  end
end