class Api::V1::SessionsController < ApplicationController
  skip_before_action :authenticate_user!, only: [:create]

  # POST /api/v1/login
  def create
    user = User.find_by(email: params[:email])

    if user&.authenticate(params[:password])
      token = JsonWebToken.encode(user_id: user.id)

      render json: {
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          role: user.role
        }
      }, status: :ok
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  # DELETE /api/v1/logout
  def destroy
    head :no_content
  end
end