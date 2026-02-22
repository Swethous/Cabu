require "rails_helper"

RSpec.describe "Api::V1::Comments", type: :request do
  let!(:user) do
    User.create!(
      email: "comments-user@example.com",
      name: "comments_user",
      password: "abc123",
      password_confirmation: "abc123"
    )
  end
  let!(:stock) { Stock.create!(yahoo_symbol: "AAPL") }
  let!(:post_record) { Post.create!(user: user, stock: stock, body: "seed post") }

  describe "GET /api/v1/posts/:post_id/comments" do
    it "returns data/meta format when empty" do
      get "/api/v1/posts/#{post_record.id}/comments", params: { limit: 20 }

      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)
      expect(body).to include("data", "meta")
      expect(body["data"]).to be_an(Array)
      expect(body["meta"]).to include("limit", "has_next", "next_cursor")
      expect(body["meta"]["limit"]).to eq(20)
      expect(body["meta"]["has_next"]).to eq(false)
      expect(body["meta"]["next_cursor"]).to be_nil
    end
  end

  describe "POST /api/v1/posts/:post_id/comments" do
    it "requires authentication" do
      post "/api/v1/posts/#{post_record.id}/comments", params: { comment: { body: "hello" } }

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)).to include("error")
    end
  end
end
