require "rails_helper"

RSpec.describe Post, type: :model do
  let(:user) do
    User.create!(
      email: "post-user@example.com",
      name: "post_user",
      password: "abc123",
      password_confirmation: "abc123"
    )
  end
  let(:stock) { Stock.create!(yahoo_symbol: "MSFT") }

  it "is valid with required associations and body" do
    post = described_class.new(user: user, stock: stock, body: "hello post")

    expect(post).to be_valid
  end

  it "is invalid without body" do
    post = described_class.new(user: user, stock: stock, body: "")

    expect(post).not_to be_valid
    expect(post.errors[:body]).to be_present
  end

  it "is invalid when body exceeds 500 characters" do
    post = described_class.new(user: user, stock: stock, body: "a" * 501)

    expect(post).not_to be_valid
    expect(post.errors[:body]).to be_present
  end
end
