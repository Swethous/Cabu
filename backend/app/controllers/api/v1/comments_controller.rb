# app/controllers/api/v1/comments_controller.rb
require "set"

class Api::V1::CommentsController < ApplicationController
  # index는 공개
  skip_before_action :authenticate_user!, only: [:index]
  # ✅ index에서만 토큰 있으면 current_user 세팅, 없으면 게스트
  before_action :authenticate_user_optional!, only: [:index]

  before_action :set_post, only: [:index, :create]
  before_action :set_comment, only: [:update, :destroy]

  # GET /api/v1/posts/:post_id/comments?limit=20&cursor=...
  def index
    limit = params[:limit].presence&.to_i || 20
    limit = [[limit, 1].max, 50].min

    scope =
      Comment.includes(:user)
             .where(post_id: @post.id)
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
    comments = has_next ? rows.first(limit) : rows

    # ✅ 이 페이지에 있는 comments 중, "내가 좋아요한 comment_id"만 한 번에 조회
    liked_ids =
      if current_user && comments.any?
        CommentLike.where(user_id: current_user.id, comment_id: comments.map(&:id))
                   .pluck(:comment_id)
                   .to_set
      else
        Set.new
      end

    next_cursor =
      if has_next && comments.any?
        encode_cursor(comments.last.created_at, comments.last.id)
      end

    render json: {
      data: comments.map { |c| comment_json(c, liked_ids) },
      meta: {
        limit: limit,
        has_next: has_next,
        next_cursor: next_cursor
      }
    }
  end

  # POST /api/v1/posts/:post_id/comments
  def create
    comment = current_user.comments.new(comment_params)
    comment.post = @post

    if comment.save
      # 작성 직후는 "내 댓글"이 맞고, 좋아요는 기본 false
      render json: comment_json(comment, Set.new), status: :created
    else
      render json: { errors: comment.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/comments/:id
  def update
    return render_forbidden unless owner?(@comment)

    if @comment.update(comment_params)
      render json: comment_json(@comment, Set.new)
    else
      render json: { errors: comment.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/comments/:id
  def destroy
    return render_forbidden unless owner?(@comment)

    @comment.destroy!
    head :no_content
  end

  private

  def set_post
    @post = Post.find(params[:post_id])
  end

  def set_comment
    @comment = Comment.includes(:user).find(params[:id])
  end

  def owner?(record)
    record.user_id == current_user.id
  end

  def render_forbidden
    render json: { error: "Forbidden" }, status: :forbidden
  end

  def comment_params
    params.require(:comment).permit(:body)
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

  # ✅ liked_ids는 index에서 계산한 Set(comment_id)
  def comment_json(comment, liked_ids = Set.new)
    {
      id: comment.id,
      post_id: comment.post_id,
      body: comment.body,
      likes_count: comment.likes_count,
      liked_by_me: liked_ids.include?(comment.id),
      editable_by_me: current_user.present? && comment.user_id == current_user.id,
      created_at: comment.created_at.iso8601,
      updated_at: comment.updated_at.iso8601,
      user: {
        id: comment.user.id,
        name: comment.user.name,
        avatar_url: comment.user.avatar_url
      }
    }
  end
end