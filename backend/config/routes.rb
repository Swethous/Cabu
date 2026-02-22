Rails.application.routes.draw do
  # todo
  # 1. 주식상세페이지 차트 로드 실패시. 심볼이 없다고 간주.
  root to: proc {
    [
      200,
      { "Content-Type" => "application/json" },
      [ { status: "ok", service: "stock_community_api" }.to_json ]
    ]
  }

  namespace :api do
    namespace :v1 do
      # 로그인 / 로그아웃 / 현재 유저 / 회원가입
      post   "login",  to: "sessions#create"
      delete "logout", to: "sessions#destroy"
      get    "me",     to: "users#me"
      post "register", to: "registrations#create"
      post "auth/google", to: "google_auth#create"
      post "password_resets", to: "password_resets#create"
      patch "password_resets", to: "password_resets#update"

      # 헬스 체크
      get "health", to: "health#index"

      # 주식 차트 legacy 라우트
      namespace :charts do
        get "indices/main", to: "indices#main"
        get "stocks", to: "stocks#show"
      end

      # 주식 차트 신규 라우트
      get "sparklines", to: "sparklines#index"

      # 주식 검색 라우트
      get "autocomplete", to: "autocomplete#index"

      # 랭킹 통합 라우트
      get "rankings", to: "rankings#index"

      # 주식 상세페이지 차트
      # ex: api/v1/stocks/:AMXP/chart?period=day&interval=5m
      get "stocks/:symbol/chart",
          to: "charts#show",
          constraints: { symbol: /[^\/]+/ },
          format: false
      # 주식 상세페이지 포스트&댓글
      resources :stocks, param: :symbol, only: [], constraints: { stock_symbol: /[^\/]+/ } do
        resources :posts, only: [ :index, :create ]
        resource :bookmark, only: [ :show, :create, :destroy ], controller: "bookmarks"
      end

      resources :posts, only: [ :update, :destroy ] do
        resources :comments, only: [ :index, :create ]

        resource :like, only: [ :create, :destroy ], controller: "post_likes"
      end

      resources :comments, only: [ :update, :destroy ] do
        resource :like, only: [ :create, :destroy ], controller: "comment_likes"
      end

      # 검색 API
      namespace :search do
        get "symbols", to: "symbols#index"
      end

      # 마이페이지 전용 라우트
      get "mypage/profile", to: "mypage#profile"
      patch "mypage/profile", to: "mypage#update"
      get "mypage/posts", to: "mypage#posts"
      get "mypage/liked_posts", to: "mypage#liked_posts"
      get "mypage/bookmarks", to: "mypage#bookmarks"
      post "contact", to: "contacts#create"
    end
  end
end
