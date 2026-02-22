require "rails_helper"

RSpec.describe "Api::V1::Autocomplete", type: :request do
  describe "GET /api/v1/autocomplete" do
    it "returns items array" do
      get "/api/v1/autocomplete", params: { q: "aapl" }

      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)
      expect(body).to include("items")
      expect(body["items"]).to be_an(Array)
    end
  end
end
