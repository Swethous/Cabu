class Api::V1::PostLikesController < ApplicationController
  before_action :set_post

  # POST /api/v1/posts/:post_id/like
  def create
    PostLike.find_or_create_by!(user_id: current_user.id, post_id: @post.id)
    @post.reload

    render json: { post_id: @post.id, liked: true, likes_count: @post.likes_count }, status: :ok
  rescue ActiveRecord::RecordNotUnique
    # 동시성으로 unique 충돌해도 결과는 "좋아요 된 상태"면 OK
    @post.reload
    render json: { post_id: @post.id, liked: true, likes_count: @post.likes_count }, status: :ok
  end

  # DELETE /api/v1/posts/:post_id/like
  def destroy
    like = PostLike.find_by(user_id: current_user.id, post_id: @post.id)
    like&.destroy

    @post.reload
    render json: { post_id: @post.id, liked: false, likes_count: @post.likes_count }, status: :ok
  end

  private

  def set_post
    @post = Post.find(params[:post_id])
  end
end