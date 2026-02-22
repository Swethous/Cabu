require "rails_helper"

RSpec.describe User, type: :model do
  it "is valid with email, name, and alphanumeric password" do
    user = described_class.new(
      email: "user-valid@example.com",
      name: "valid_user",
      password: "abc123",
      password_confirmation: "abc123"
    )

    expect(user).to be_valid
  end

  it "is invalid with malformed email" do
    user = described_class.new(
      email: "invalid-email",
      name: "invalid_email_user",
      password: "abc123",
      password_confirmation: "abc123"
    )

    expect(user).not_to be_valid
    expect(user.errors[:email]).to be_present
  end

  it "is invalid when password is not alphanumeric" do
    user = described_class.new(
      email: "invalid-password@example.com",
      name: "invalid_password_user",
      password: "123456",
      password_confirmation: "123456"
    )

    expect(user).not_to be_valid
    expect(user.errors[:password]).to be_present
  end
end
