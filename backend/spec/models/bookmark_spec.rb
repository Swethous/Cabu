require "rails_helper"

RSpec.describe Bookmark, type: :model do
  let(:user) do
    User.create!(
      email: "bookmark-user@example.com",
      name: "bookmark_user",
      password: "abc123",
      password_confirmation: "abc123"
    )
  end
  let(:stock) { Stock.create!(yahoo_symbol: "TSLA") }

  it "does not allow duplicate bookmark per user and stock" do
    described_class.create!(user: user, stock: stock)
    duplicate = described_class.new(user: user, stock: stock)

    expect(duplicate).not_to be_valid
    expect(duplicate.errors[:stock_id]).to be_present
  end
end
