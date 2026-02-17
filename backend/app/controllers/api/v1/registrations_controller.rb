class Api::V1::RegistrationsController < ApplicationController
  skip_before_action :authenticate_user!, only: [:create]

  # POST /api/v1/register
  def create
    user = User.new(register_params)

    if user.save
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
      }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def register_params
    # name 같은 필드는 네 User 컬럼에 맞게 조정
    params.permit(:email, :password, :password_confirmation, :name)
  end
end