class UpdatePopularRankingsJob < ApplicationJob
  queue_as :default

  MARKET = "ALL"
  KIND   = "popular"
  WINDOW_DAYS = 7
  POST_BASE_SCORE = 3.0
  COMMENT_BASE_SCORE = 1.0
  RECENCY_WEIGHT_LAST_1H = 8.0
  RECENCY_WEIGHT_LAST_1D = 3.0
  RECENCY_WEIGHT_LAST_3D = 1.2
  RECENCY_WEIGHT_LAST_7D = 0.4

  def perform(limit: 20)
    fetched_at = Time.current
    cutoff = fetched_at - WINDOW_DAYS.days

    scores = Hash.new(0.0)

    weighted_scores_for_posts(cutoff: cutoff, now: fetched_at).each do |stock_id, score|
      next if stock_id.nil?

      scores[stock_id] += score.to_f
    end

    weighted_scores_for_comments(cutoff: cutoff, now: fetched_at).each do |stock_id, score|
      next if stock_id.nil?

      scores[stock_id] += score.to_f
    end

    top_stock_ids = scores.sort_by { |stock_id, score| [ -score, stock_id ] }.first(limit).map(&:first)

    return if top_stock_ids.empty?

    now = Time.current

    ranking_rows = top_stock_ids.each_with_index.map do |stock_id, idx|
      {
        market: MARKET,
        kind: KIND,
        rank: idx + 1,
        stock_id: stock_id,
        as_of: nil,
        fetched_at: fetched_at,
        extra: {
          score: scores[stock_id].round(4),
          window_days: WINDOW_DAYS
        },
        created_at: now,
        updated_at: now
      }
    end

    RankingRow.transaction do
      RankingRow.where(market: MARKET, kind: KIND).delete_all

      RankingRow.insert_all(ranking_rows) if ranking_rows.present?
    end
  end

  private

  def weighted_scores_for_posts(cutoff:, now:)
    weight_case = recency_weight_case_sql(column: "created_at", now: now)
    expr = "#{POST_BASE_SCORE} * (#{weight_case})"

    Post.where("created_at >= ?", cutoff)
        .group(:stock_id)
        .sum(Arel.sql(expr))
  end

  def weighted_scores_for_comments(cutoff:, now:)
    weight_case = recency_weight_case_sql(column: "comments.created_at", now: now)
    expr = "#{COMMENT_BASE_SCORE} * (#{weight_case})"

    Comment.joins(:post)
           .where("comments.created_at >= ?", cutoff)
           .group("posts.stock_id")
           .sum(Arel.sql(expr))
  end

  def recency_weight_case_sql(column:, now:)
    conn = ActiveRecord::Base.connection
    last_1h = conn.quote(now - 1.hour)
    last_1d = conn.quote(now - 1.day)
    last_3d = conn.quote(now - 3.days)

    <<~SQL.squish
      CASE
        WHEN #{column} >= #{last_1h} THEN #{RECENCY_WEIGHT_LAST_1H}
        WHEN #{column} >= #{last_1d} THEN #{RECENCY_WEIGHT_LAST_1D}
        WHEN #{column} >= #{last_3d} THEN #{RECENCY_WEIGHT_LAST_3D}
        ELSE #{RECENCY_WEIGHT_LAST_7D}
      END
    SQL
  end
end
