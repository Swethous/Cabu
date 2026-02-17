# app/controllers/api/v1/posts_controller.rb
require "set"

class Api::V1::PostsController < ApplicationController
  # index는 공개
  skip_before_action :authenticate_user!, only: [:index]
  # ✅ index에서만 "토큰 있으면 current_user 세팅, 없으면 게스트" (401 안 냄)
  before_action :authenticate_user_optional!, only: [:index]

  # update/destroy는 인증 필요 + owner 체크
  before_action :set_post, only: [:update, :destroy]

  # GET /api/v1/stocks/:symbol/posts
  def index
    stock = find_or_create_stock!(params[:stock_symbol])

    limit = params[:limit].presence&.to_i || 20
    limit = [[limit, 1].max, 50].min

    scope = Post.includes(:user)
                .where(stock_id: stock.id)
                .order(created_at: :desc, id: :desc)

    if params[:cursor].present?
      cursor_time, cursor_id = decode_cursor(params[:cursor])
      scope = scope.where(
        "created_at < ? OR (created_at = ? AND id < ?)",
        cursor_time, cursor_time, cursor_id
      )
    end

    rows = scope.limit(limit + 1).to_a
    has_next = rows.length > limit
    posts = has_next ? rows.first(limit) : rows

    # ✅ 이 페이지에 있는 posts 중, "내가 좋아요한 post_id"만 한 번에 조회
    liked_ids =
      if current_user && posts.any?
        PostLike.where(user_id: current_user.id, post_id: posts.map(&:id))
                .pluck(:post_id)
                .to_set
      else
        Set.new
      end

    next_cursor =
      if has_next && posts.any?
        encode_cursor(posts.last.created_at, posts.last.id)
      end

    render json: {
      data: posts.map { |p| post_json(p, liked_ids) },
      meta: {
        limit: limit,
        has_next: has_next,
        next_cursor: next_cursor
      }
    }
  end

  # POST /api/v1/stocks/:symbol/posts
  def create
    stock = find_or_create_stock!(params[:stock_symbol])

    post = current_user.posts.new(post_params)
    post.stock = stock

    if post.save
      # 작성자는 당연히 "내 글"이고, 좋아요 여부는 기본 false (필요하면 true로 바꿀 수 있음)
      render json: post_json(post, Set.new), status: :created
    else
      render json: { errors: post.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/posts/:id
  def update
    return render_forbidden unless owner?(@post)

    if @post.update(post_params)
      render json: post_json(@post, Set.new)
    else
      render json: { errors: @post.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/posts/:id
  def destroy
    return render_forbidden unless owner?(@post)

    @post.destroy!
    head :no_content
  end

  private

  def set_post
    @post = Post.find(params[:id])
  end

  def owner?(record)
    record.user_id == current_user.id
  end

  def render_forbidden
    render json: { error: "Forbidden" }, status: :forbidden
  end

  def post_params
    params.require(:post).permit(:body, :image_url)
  end

  def find_or_create_stock!(raw_symbol)
    symbol = raw_symbol.to_s.strip.upcase
    # ✅ Yahoo 심볼 허용:
    # - 주식: AAPL, 7203.T
    # - 지수: ^GSPC, ^IXIC, ^N225
    # - FX:   USDJPY=X
    raise ActionController::BadRequest, "Invalid symbol" unless symbol.match?(/\A[A-Z0-9^][A-Z0-9.\-=^]*\z/)

    Stock.find_or_create_by!(yahoo_symbol: symbol).tap do |s|
      s.update_column(:last_seen_at, Time.current) # optional
    end
  end

  def decode_cursor(cursor)
    t_str, id_str = cursor.to_s.split("|", 2)
    raise ActionController::BadRequest, "Invalid cursor" if t_str.blank? || id_str.blank?

    [Time.iso8601(t_str), Integer(id_str)]
  rescue ArgumentError
    raise ActionController::BadRequest, "Invalid cursor"
  end

  def encode_cursor(time, id)
    "#{time.utc.iso8601}|#{id}"
  end

  # ✅ liked_ids는 index에서 계산한 Set(post_id)
  def post_json(post, liked_ids = Set.new)
    {
      id: post.id,
      stock_id: post.stock_id,
      preview: post.body.to_s.truncate(120),
      body: post.body,
      image_url: post.image_url,
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      liked_by_me: liked_ids.include?(post.id),
      editable_by_me: current_user.present? && post.user_id == current_user.id,
      created_at: post.created_at.iso8601,
      updated_at: post.updated_at.iso8601,
      user: {
        id: post.user.id,
        name: post.user.name,
        avatar_url: post.user.avatar_url
      }
    }
  end
end
