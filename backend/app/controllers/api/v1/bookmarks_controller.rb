class Api::V1::BookmarksController < ApplicationController
  before_action :set_stock

  # GET /api/v1/stocks/:symbol/bookmark
  def show
    render json: {
      symbol: @stock.yahoo_symbol,
      bookmarked: bookmarked?
    }
  end

  # POST /api/v1/stocks/:symbol/bookmark
  def create
    Bookmark.find_or_create_by!(user_id: current_user.id, stock_id: @stock.id)

    render json: {
      symbol: @stock.yahoo_symbol,
      bookmarked: true
    }, status: :ok
  rescue ActiveRecord::RecordNotUnique
    render json: {
      symbol: @stock.yahoo_symbol,
      bookmarked: true
    }, status: :ok
  end

  # DELETE /api/v1/stocks/:symbol/bookmark
  def destroy
    bookmark = Bookmark.find_by(user_id: current_user.id, stock_id: @stock.id)
    bookmark&.destroy

    render json: {
      symbol: @stock.yahoo_symbol,
      bookmarked: false
    }, status: :ok
  end

  private

  def set_stock
    @stock = find_or_create_stock!(params[:stock_symbol])
  end

  def bookmarked?
    Bookmark.exists?(user_id: current_user.id, stock_id: @stock.id)
  end

  def find_or_create_stock!(raw_symbol)
    symbol = raw_symbol.to_s.strip.upcase
    # Yahoo 심볼 허용: ^N225, ^GSPC, USDJPY=X, 7203.T ...
    raise ActionController::BadRequest, "Invalid symbol" unless symbol.match?(/\A[A-Z0-9^][A-Z0-9.\-=^]*\z/)

    Stock.find_or_create_by!(yahoo_symbol: symbol).tap do |s|
      s.update_column(:last_seen_at, Time.current)
    end
  end
end
