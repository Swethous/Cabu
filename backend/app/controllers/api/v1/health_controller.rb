# app/controllers/api/v1/health_controller.rb
class Api::V1::HealthController < ApplicationController
  # 헬스 체크는 인증 없이도 접근 가능
  skip_before_action :authenticate_user!

  # GET /api/v1/health
  def index
    render json: { status: "ok", time: Time.current }
  end
end