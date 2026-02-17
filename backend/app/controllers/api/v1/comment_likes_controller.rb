class Api::V1::CommentLikesController < ApplicationController
  before_action :set_comment

  # POST /api/v1/comments/:comment_id/like
  def create
    CommentLike.find_or_create_by!(user_id: current_user.id, comment_id: @comment.id)
    @comment.reload

    render json: { comment_id: @comment.id, liked: true, likes_count: @comment.likes_count }, status: :ok
  rescue ActiveRecord::RecordNotUnique
    @comment.reload
    render json: { comment_id: @comment.id, liked: true, likes_count: @comment.likes_count }, status: :ok
  end

  # DELETE /api/v1/comments/:comment_id/like
  def destroy
    like = CommentLike.find_by(user_id: current_user.id, comment_id: @comment.id)
    like&.destroy

    @comment.reload
    render json: { comment_id: @comment.id, liked: false, likes_count: @comment.likes_count }, status: :ok
  end

  private

  def set_comment
    @comment = Comment.find(params[:comment_id])
  end
end