require "rails_helper"

RSpec.describe "Api::V1::Bookmarks", type: :request do
  describe "GET /api/v1/stocks/:symbol/bookmark" do
    it "requires authentication" do
      get "/api/v1/stocks/AAPL/bookmark"

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)).to include("error")
    end
  end
end
