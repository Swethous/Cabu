# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_02_19_123000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "bookmarks", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "stock_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["stock_id"], name: "index_bookmarks_on_stock_id"
    t.index ["user_id", "stock_id"], name: "index_bookmarks_on_user_id_and_stock_id", unique: true
    t.index ["user_id"], name: "index_bookmarks_on_user_id"
  end

  create_table "comment_likes", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "comment_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["comment_id"], name: "index_comment_likes_on_comment_id"
    t.index ["user_id", "comment_id"], name: "index_comment_likes_on_user_id_and_comment_id", unique: true
    t.index ["user_id"], name: "index_comment_likes_on_user_id"
  end

  create_table "comments", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "post_id", null: false
    t.text "body"
    t.integer "likes_count", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["post_id", "created_at"], name: "index_comments_on_post_id_and_created_at"
    t.index ["user_id"], name: "index_comments_on_user_id"
  end

  create_table "contact_inquiries", force: :cascade do |t|
    t.bigint "user_id"
    t.string "category", limit: 30, default: "other", null: false
    t.string "subject", limit: 200, null: false
    t.text "body", null: false
    t.string "reply_email", limit: 255, null: false
    t.string "status", limit: 20, default: "new", null: false
    t.string "locale", limit: 10, default: "ja", null: false
    t.text "admin_note"
    t.datetime "responded_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_contact_inquiries_on_created_at"
    t.index ["reply_email"], name: "index_contact_inquiries_on_reply_email"
    t.index ["status", "created_at"], name: "index_contact_inquiries_on_status_and_created_at"
    t.index ["status"], name: "index_contact_inquiries_on_status"
    t.index ["user_id"], name: "index_contact_inquiries_on_user_id"
  end

  create_table "instrument_masters", force: :cascade do |t|
    t.string "provider", limit: 30, null: false
    t.string "provider_symbol", limit: 50, null: false
    t.string "symbol", limit: 60, null: false
    t.string "name_en", limit: 250
    t.string "name_jp", limit: 250
    t.string "exchange", limit: 30
    t.string "security_type", limit: 30
    t.string "jpx_section", limit: 50
    t.boolean "is_active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["exchange"], name: "index_instrument_masters_on_exchange"
    t.index ["is_active"], name: "index_instrument_masters_on_is_active"
    t.index ["provider", "provider_symbol"], name: "index_instrument_masters_on_provider_and_provider_symbol", unique: true
    t.index ["provider"], name: "index_instrument_masters_on_provider"
    t.index ["symbol"], name: "index_instrument_masters_on_symbol", unique: true
  end

  create_table "post_likes", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "post_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["post_id"], name: "index_post_likes_on_post_id"
    t.index ["user_id", "post_id"], name: "index_post_likes_on_user_id_and_post_id", unique: true
    t.index ["user_id"], name: "index_post_likes_on_user_id"
  end

  create_table "posts", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "stock_id", null: false
    t.text "body"
    t.text "image_url"
    t.integer "likes_count", default: 0, null: false
    t.integer "comments_count", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["stock_id", "created_at"], name: "index_posts_on_stock_id_and_created_at"
    t.index ["user_id"], name: "index_posts_on_user_id"
  end

  create_table "price_candles", force: :cascade do |t|
    t.bigint "stock_id", null: false
    t.datetime "ts", null: false
    t.string "interval", limit: 20, null: false
    t.decimal "open", precision: 18, scale: 6
    t.decimal "high", precision: 18, scale: 6
    t.decimal "low", precision: 18, scale: 6
    t.decimal "close", precision: 18, scale: 6
    t.bigint "volume", default: 0, null: false
    t.datetime "fetched_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["stock_id", "interval", "ts"], name: "index_price_candles_on_stock_id_interval_ts_unique", unique: true
    t.index ["stock_id"], name: "index_price_candles_on_stock_id"
  end

  create_table "ranking_rows", force: :cascade do |t|
    t.string "market", limit: 10, null: false
    t.string "kind", limit: 30, null: false
    t.integer "rank", null: false
    t.bigint "stock_id", null: false
    t.datetime "as_of"
    t.datetime "fetched_at", null: false
    t.jsonb "extra", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["market", "kind", "rank"], name: "index_ranking_rows_on_market_kind_rank", unique: true
    t.index ["market", "kind"], name: "index_ranking_rows_on_market_kind"
    t.index ["stock_id"], name: "index_ranking_rows_on_stock_id"
  end

  create_table "stock_snapshots", force: :cascade do |t|
    t.bigint "stock_id", null: false
    t.decimal "price", precision: 18, scale: 6
    t.decimal "prev_close", precision: 18, scale: 6
    t.decimal "change_percent", precision: 12, scale: 6
    t.bigint "market_cap"
    t.string "currency", limit: 10
    t.datetime "as_of"
    t.datetime "fetched_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["market_cap"], name: "index_stock_snapshots_on_market_cap"
    t.index ["stock_id"], name: "index_stock_snapshots_on_stock_id", unique: true
  end

  create_table "stocks", force: :cascade do |t|
    t.string "yahoo_symbol", limit: 30, null: false
    t.string "name", limit: 250
    t.string "name_jp", limit: 250
    t.string "market", limit: 250
    t.string "sector", limit: 250
    t.boolean "is_core", default: false, null: false
    t.boolean "is_active", default: true, null: false
    t.integer "sort_order", default: 0, null: false
    t.boolean "sparkline_enabled", default: false, null: false
    t.string "country", limit: 10, default: "UNKNOWN", null: false
    t.datetime "last_seen_at"
    t.string "currency", limit: 10
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["country"], name: "index_stocks_on_country"
    t.index ["currency"], name: "index_stocks_on_currency"
    t.index ["is_core", "sort_order"], name: "index_stocks_on_is_core_and_sort_order"
    t.index ["last_seen_at"], name: "index_stocks_on_last_seen_at"
    t.index ["sparkline_enabled"], name: "index_stocks_on_sparkline_enabled"
    t.index ["yahoo_symbol"], name: "index_stocks_on_yahoo_symbol", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "name"
    t.string "avatar_url", limit: 300
    t.string "role", limit: 30
    t.string "password_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "reset_password_token_digest"
    t.datetime "reset_password_sent_at"
    t.index "lower((name)::text)", name: "index_users_on_lower_name", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token_digest"], name: "index_users_on_reset_password_token_digest", unique: true
  end

  add_foreign_key "bookmarks", "stocks"
  add_foreign_key "bookmarks", "users"
  add_foreign_key "comment_likes", "comments"
  add_foreign_key "comment_likes", "users"
  add_foreign_key "comments", "posts"
  add_foreign_key "comments", "users"
  add_foreign_key "contact_inquiries", "users"
  add_foreign_key "post_likes", "posts"
  add_foreign_key "post_likes", "users"
  add_foreign_key "posts", "stocks"
  add_foreign_key "posts", "users"
  add_foreign_key "price_candles", "stocks"
  add_foreign_key "ranking_rows", "stocks"
  add_foreign_key "stock_snapshots", "stocks"
end
