class Api::V1::ContactsController < ApplicationController
  RATE_LIMIT_WINDOW = 30.seconds

  # POST /api/v1/contact
  def create
    if rate_limited?
      return render json: { error: "Too many requests. Please wait a moment." }, status: :too_many_requests
    end

    inquiry = ContactInquiry.new(contact_params)
    inquiry.user = current_user
    inquiry.reply_email = current_user.email
    inquiry.locale = "ja"
    inquiry.status = "new"

    if inquiry.save
      send_admin_notification(inquiry)
      render json: {
        id: inquiry.id,
        message: "Inquiry submitted successfully."
      }, status: :created
    else
      render json: { errors: inquiry.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def contact_params
    params.require(:contact).permit(:category, :subject, :body)
  end

  def rate_limited?
    ContactInquiry.where(user_id: current_user.id)
                  .where("created_at >= ?", RATE_LIMIT_WINDOW.ago)
                  .exists?
  end

  def send_admin_notification(inquiry)
    ContactInquiryMailer.notify_admin(inquiry).deliver_now
  rescue StandardError => e
    Rails.logger.error("[ContactInquiryMailer] delivery failed inquiry_id=#{inquiry.id} error=#{e.class}: #{e.message}")
  end
end
