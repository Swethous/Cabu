class Api::V1::MypageController < ApplicationController
  # GET /api/v1/mypage/profile
  def profile
    posts_count = current_user.posts.count
    received_likes_count = PostLike.joins(:post)
                                   .where(posts: { user_id: current_user.id })
                                   .count
    render json: {
      user: {
        id: current_user.id,
        email: current_user.email,
        name: current_user.name,
        avatar_url: current_user.avatar_url,
        created_at: current_user.created_at.iso8601,
        stats: {
          posts_count: posts_count,
          received_likes_count: received_likes_count
        }
      }
    }
  end

  def update
    if current_user.update(user_params)
      profile # GET profile 로직 재활용하여 응답
    else
      render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # GET /api/v1/mypage/posts
  def posts
    limit = params[:limit].presence&.to_i || 20
    limit = [[limit, 1].max, 50].min

    scope = current_user.posts
                .includes(:stock, stock: :stock_snapshot)
                .order(created_at: :desc, id: :desc)

    if params[:cursor].present?
      cursor_time, cursor_id = decode_cursor(params[:cursor])
      scope = scope.where(
        "created_at < ? OR (created_at = ? AND id < ?)",
        cursor_time, cursor_time, cursor_id
      )
    end

    rows = scope.limit(limit + 1).to_a
    has_next = rows.length > limit
    posts = has_next ? rows.first(limit) : rows

    next_cursor =
      if has_next && posts.any?
        encode_cursor(posts.last.created_at, posts.last.id)
      end

    render json: {
      data: posts.map { |p| my_post_json(p) },
      meta: {
        limit: limit,
        has_next: has_next,
        next_cursor: next_cursor
      }
    }
  end

  # GET /api/v1/mypage/liked_posts
  def liked_posts
    limit = params[:limit].presence&.to_i || 20
    limit = [[limit, 1].max, 50].min

    scope = Post.joins(:post_likes)
                .includes(:user, :stock, stock: :stock_snapshot)
                .where(post_likes: { user_id: current_user.id })
                .order("post_likes.created_at DESC, post_likes.id DESC")

    if params[:cursor].present?
      cursor_time, cursor_id = decode_cursor(params[:cursor])
      scope = scope.where(
        "post_likes.created_at < ? OR (post_likes.created_at = ? AND post_likes.id < ?)",
        cursor_time, cursor_time, cursor_id
      )
    end

    rows = scope.limit(limit + 1).to_a
    has_next = rows.length > limit
    posts = has_next ? rows.first(limit) : rows

    next_cursor =
      if has_next && posts.any?
        like = PostLike.find_by(user_id: current_user.id, post_id: posts.last.id)
        encode_cursor(like.created_at, like.id) if like
      end

    render json: {
      data: posts.map { |p| liked_post_json(p) },
      meta: {
        limit: limit,
        has_next: has_next,
        next_cursor: next_cursor
      }
    }
  end

  # GET /api/v1/mypage/bookmarks
  def bookmarks
    limit = params[:limit].presence&.to_i || 20
    limit = [[limit, 1].max, 50].min

    scope = current_user.bookmarks
                        .includes(stock: :stock_snapshot)
                        .order(created_at: :desc, id: :desc)

    if params[:cursor].present?
      cursor_time, cursor_id = decode_cursor(params[:cursor])
      scope = scope.where(
        "created_at < ? OR (created_at = ? AND id < ?)",
        cursor_time, cursor_time, cursor_id
      )
    end

    rows = scope.limit(limit + 1).to_a
    has_next = rows.length > limit
    bookmarks = has_next ? rows.first(limit) : rows

    next_cursor =
      if has_next && bookmarks.any?
        encode_cursor(bookmarks.last.created_at, bookmarks.last.id)
      end

    render json: {
      data: bookmarks.map { |b| bookmark_json(b) },
      meta: {
        limit: limit,
        has_next: has_next,
        next_cursor: next_cursor
      }
    }
  end

  private

  def user_params
    params.require(:user).permit(:name, :avatar_url)
  end

  def my_post_json(post)
    {
      id: post.id,
      body: post.body,
      created_at: post.created_at.iso8601,
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      stock: {
        symbol: post.stock.yahoo_symbol,
        name: post.stock.name,
        name_jp: post.stock.name_jp
      }
    }
  end

  def liked_post_json(post)
    {
      id: post.id,
      body: post.body,
      created_at: post.created_at.iso8601,
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      liked_by_me: true,
      user: {
        id: post.user.id,
        name: post.user.name,
        avatar_url: post.user.avatar_url
      },
      stock: {
        symbol: post.stock.yahoo_symbol,
        name: post.stock.name,
        name_jp: post.stock.name_jp
      }
    }
  end

  def bookmark_json(bookmark)
    stock = bookmark.stock
    snapshot = stock.stock_snapshot

    {
      id: bookmark.id,
      bookmarked_at: bookmark.created_at.iso8601,
      stock: {
        id: stock.id,
        symbol: stock.yahoo_symbol,
        name: stock.name,
        name_jp: stock.name_jp,
        market: stock.market,
        currency: snapshot&.currency
      }
    }
  end

  def encode_cursor(time, id)
    Base64.strict_encode64("#{time.to_f}|#{id}")
  end

  def decode_cursor(cursor)
    decoded = Base64.decode64(cursor)
    time_f, id = decoded.split("|")
    [Time.at(time_f.to_f), id.to_i]
  rescue
    [Time.current, 0]
  end
end
