class ApplicationController < ActionController::API
  before_action :authenticate_user!

  attr_reader :current_user

  private

  def authenticate_user!
    token = bearer_token
    payload = JsonWebToken.decode(token)

    user_id = payload&.[](:user_id)
    user = user_id && User.find_by(id: user_id)

    if user
      @current_user = user
    else
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end

  # 추가: 있으면 인증, 없으면 그냥 통과(게스트)
  def authenticate_user_optional!
    token = bearer_token
    return @current_user = nil if token.blank?

    payload = JsonWebToken.decode(token)
    user_id = payload&.[](:user_id)
    @current_user = user_id && User.find_by(id: user_id)
    # 유저 못 찾거나 토큰 이상해도 401 내지 않고 nil로 둠
  rescue StandardError
    @current_user = nil
  end

  def bearer_token
    auth = request.headers["Authorization"]
    return nil if auth.blank?

    scheme, token = auth.split(" ", 2)
    scheme == "Bearer" ? token : nil
  end
end
