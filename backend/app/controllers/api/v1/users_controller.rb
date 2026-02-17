class Api::V1::UsersController < ApplicationController
  # GET /api/v1/me
  def me
    render json: {
      user: {
        id: current_user.id,
        email: current_user.email,
        name: current_user.name,
        avatar_url: current_user.avatar_url,
        role: current_user.role
      }
    }, status: :ok
  end
end