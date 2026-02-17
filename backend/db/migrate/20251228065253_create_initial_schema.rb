# frozen_string_literal: true

class CreateInitialSchema < ActiveRecord::Migration[7.2]
  def change
    enable_extension "plpgsql" unless extension_enabled?("plpgsql")

    # -----------------------------
    # users
    # -----------------------------
    create_table :users do |t|
      t.string :email, null: false
      t.string :name
      t.string :avatar_url, limit: 300
      t.string :role, limit: 30
      t.string :password_digest, null: false
      t.timestamps null: false
    end
    add_index :users, :email, unique: true

    # -----------------------------
    # stocks
    # -----------------------------
    create_table :stocks do |t|
      t.string  :yahoo_symbol, limit: 30, null: false
      t.string  :name,     limit: 250
      t.string  :name_kr,  limit: 250
      t.string  :market,   limit: 250
      t.string  :sector,   limit: 250

      t.boolean :is_core, default: false, null: false
      t.boolean :is_active, default: true, null: false
      t.integer :sort_order, default: 0, null: false
      t.boolean :sparkline_enabled, default: false, null: false

      t.string  :country, limit: 10, default: "UNKNOWN", null: false
      t.datetime :last_seen_at
      t.string  :currency, limit: 10

      t.timestamps null: false
    end

    add_index :stocks, :yahoo_symbol, unique: true
    add_index :stocks, :country
    add_index :stocks, :currency
    add_index :stocks, [:is_core, :sort_order]
    add_index :stocks, :last_seen_at
    add_index :stocks, :sparkline_enabled

    # -----------------------------
    # stock_snapshots (latest only per stock)
    # -----------------------------
    create_table :stock_snapshots do |t|
      t.references :stock, null: false, foreign_key: true, index: false

      t.decimal :price, precision: 18, scale: 6
      t.decimal :prev_close, precision: 18, scale: 6
      t.decimal :change_percent, precision: 9, scale: 4
      t.bigint  :market_cap
      t.string  :currency, limit: 10
      t.datetime :as_of
      t.datetime :fetched_at, null: false

      t.timestamps null: false
    end

    # ✅ upsert_all unique_by로 쓸 이름을 "고정"
    add_index :stock_snapshots, :stock_id, unique: true, name: :index_stock_snapshots_on_stock_id
    add_index :stock_snapshots, :market_cap

    # -----------------------------
    # ranking_rows
    # -----------------------------
    create_table :ranking_rows do |t|
      t.string  :market, limit: 10, null: false   # "US"/"JP"
      t.string  :kind, limit: 30, null: false     # "market_cap"/"gainers"/"losers"
      t.integer :rank, null: false

      t.references :stock, null: false, foreign_key: true, index: false

      t.datetime :as_of
      t.datetime :fetched_at, null: false
      t.jsonb :extra, default: {}, null: false

      t.timestamps null: false
    end

    add_index :ranking_rows, [:market, :kind, :rank], unique: true, name: :index_ranking_rows_on_market_kind_rank
    add_index :ranking_rows, [:market, :kind], name: :index_ranking_rows_on_market_kind
    add_index :ranking_rows, :stock_id, name: :index_ranking_rows_on_stock_id

    # -----------------------------
    # posts
    # -----------------------------
    create_table :posts do |t|
      t.references :user, null: false, foreign_key: true, index: false
      t.references :stock, null: false, foreign_key: true, index: false

      t.text :body
      t.text :image_url
      t.integer :likes_count, default: 0, null: false
      t.integer :comments_count, default: 0, null: false

      t.timestamps null: false
    end

    # (stock_id, created_at) 인덱스는 stock_id 단독 조회도 커버(선두 컬럼)
    add_index :posts, [:stock_id, :created_at], name: :index_posts_on_stock_id_and_created_at
    add_index :posts, :user_id, name: :index_posts_on_user_id

    # -----------------------------
    # comments
    # -----------------------------
    create_table :comments do |t|
      t.references :user, null: false, foreign_key: true, index: false
      t.references :post, null: false, foreign_key: true, index: false

      t.text :body
      t.integer :likes_count, default: 0, null: false

      t.timestamps null: false
    end

    add_index :comments, [:post_id, :created_at], name: :index_comments_on_post_id_and_created_at
    add_index :comments, :user_id, name: :index_comments_on_user_id

    # -----------------------------
    # post_likes
    # -----------------------------
    create_table :post_likes do |t|
      t.references :user, null: false, foreign_key: true, index: false
      t.references :post, null: false, foreign_key: true, index: false
      t.timestamps null: false
    end

    add_index :post_likes, [:user_id, :post_id], unique: true, name: :index_post_likes_on_user_id_and_post_id
    add_index :post_likes, :post_id, name: :index_post_likes_on_post_id
    add_index :post_likes, :user_id, name: :index_post_likes_on_user_id

    # -----------------------------
    # comment_likes
    # -----------------------------
    create_table :comment_likes do |t|
      t.references :user, null: false, foreign_key: true, index: false
      t.references :comment, null: false, foreign_key: true, index: false
      t.timestamps null: false
    end

    add_index :comment_likes, [:user_id, :comment_id], unique: true, name: :index_comment_likes_on_user_id_and_comment_id
    add_index :comment_likes, :comment_id, name: :index_comment_likes_on_comment_id
    add_index :comment_likes, :user_id, name: :index_comment_likes_on_user_id

    # -----------------------------
    # bookmarks
    # -----------------------------
    create_table :bookmarks do |t|
      t.references :user, null: false, foreign_key: true, index: false
      t.references :stock, null: false, foreign_key: true, index: false
      t.timestamps null: false
    end

    add_index :bookmarks, [:user_id, :stock_id], unique: true, name: :index_bookmarks_on_user_id_and_stock_id
    add_index :bookmarks, :user_id, name: :index_bookmarks_on_user_id
    add_index :bookmarks, :stock_id, name: :index_bookmarks_on_stock_id

    # -----------------------------
    # price_candles
    # -----------------------------
    create_table :price_candles do |t|
      t.references :stock, null: false, foreign_key: true, index: false

      t.datetime :ts, null: false
      t.string   :interval, limit: 20, null: false
      t.decimal  :open,  precision: 18, scale: 6
      t.decimal  :high,  precision: 18, scale: 6
      t.decimal  :low,   precision: 18, scale: 6
      t.decimal  :close, precision: 18, scale: 6
      t.bigint   :volume, default: 0, null: false
      t.datetime :fetched_at, null: false

      t.timestamps null: false
    end

    add_index :price_candles, [:stock_id, :interval, :ts],
              unique: true,
              name: :index_price_candles_on_stock_id_interval_ts_unique
    add_index :price_candles, :stock_id, name: :index_price_candles_on_stock_id
  end
end