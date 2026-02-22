require "rails_helper"

RSpec.describe "Api::V1::Rankings", type: :request do
  describe "GET /api/v1/rankings" do
    it "returns rankings payload" do
      get "/api/v1/rankings", params: { limit: 5 }

      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)
      expect(body).to include("fetchedAt", "limit", "rankings")
      expect(body["limit"]).to eq(5)
      expect(body["rankings"]).to be_a(Hash)
    end
  end
end
