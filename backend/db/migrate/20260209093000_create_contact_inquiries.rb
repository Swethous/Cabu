# frozen_string_literal: true

class CreateContactInquiries < ActiveRecord::Migration[7.2]
  def change
    create_table :contact_inquiries do |t|
      t.references :user, null: true, foreign_key: true

      t.string :category, null: false, limit: 30, default: "other"
      t.string :subject, null: false, limit: 200
      t.text :body, null: false
      t.string :reply_email, null: false, limit: 255

      t.string :status, null: false, limit: 20, default: "new"
      t.string :locale, null: false, limit: 10, default: "ja"

      t.text :admin_note
      t.datetime :responded_at

      t.timestamps null: false
    end

    add_index :contact_inquiries, :status
    add_index :contact_inquiries, :reply_email
    add_index :contact_inquiries, :created_at
    add_index :contact_inquiries, [ :status, :created_at ]
  end
end
