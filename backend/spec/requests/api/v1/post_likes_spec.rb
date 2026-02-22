require "rails_helper"

RSpec.describe "Api::V1::PostLikes", type: :request do
  describe "POST /api/v1/posts/:post_id/like" do
    it "requires authentication" do
      post "/api/v1/posts/1/like"

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)).to include("error")
    end
  end
end
