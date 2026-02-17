require "rails_helper"

RSpec.describe "Api::V1::Posts", type: :request do
  before { host! "localhost" }
  describe "GET /api/v1/stocks/:stock_symbol/posts" do
    it "returns data/meta format when empty" do
      get "/api/v1/stocks/AAPL/posts", params: { limit: 20 }
      puts response.status      
      puts response.body

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      expect(json).to include("data", "meta")

      expect(json).to have_key("data")
        expect(json).to have_key("meta")
        expect(json["data"]).to be_an(Array)

        # meta shape
        expect(json["meta"]).to include("limit", "has_next", "next_cursor")
      expect(json["meta"]).to include("limit", "has_next", "next_cursor")
      expect(json["meta"]["limit"]).to eq(20)
      expect(json["meta"]["has_next"]).to eq(false)
      expect(json["meta"]["next_cursor"]).to be_nil
    end
  end
end