require "rails_helper"

RSpec.describe "Api::V1::Sessions", type: :request do
  describe "POST /api/v1/login" do
    it "returns unauthorized with invalid credentials" do
      post "/api/v1/login", params: { email: "not-found@example.com", password: "wrong123" }

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)).to include("error")
    end
  end
end
