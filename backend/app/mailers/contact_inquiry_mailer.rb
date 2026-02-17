class ContactInquiryMailer < ApplicationMailer
  ADMIN_CONTACT_EMAIL = ENV.fetch("CONTACT_ADMIN_EMAIL", "mch050399@gmail.com")

  CATEGORY_LABELS = {
    "bug_report" => "バグ報告",
    "feature_request" => "機能要望",
    "account" => "アカウント",
    "other" => "その他"
  }.freeze

  def notify_admin(inquiry)
    @inquiry = inquiry
    @category_label = CATEGORY_LABELS.fetch(@inquiry.category, @inquiry.category)

    mail(
      to: ADMIN_CONTACT_EMAIL,
      subject: "[Cabu] 新しいお問い合わせ ##{@inquiry.id}"
    )
  end
end
