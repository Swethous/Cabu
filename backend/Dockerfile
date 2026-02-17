# Dockerfile
FROM ruby:3.3

ENV LANG=C.UTF-8
ENV TZ=Asia/Tokyo

# Rails + PostgreSQL에 필요한 패키지만 설치
RUN apt-get update -qq && \
    apt-get install -y \
      curl \
      build-essential \
      libpq-dev \
      postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Gem 설치 (의존성만 먼저 복사해서 layer 캐시 활용)
COPY Gemfile Gemfile.lock ./
RUN bundle install

# 나머지 앱 코드 복사
COPY . .

# ❌ 더 이상 assets:precompile 필요 없음 (뷰/JS 없음)
# RUN bundle exec rails assets:precompile

# ✅ 컨테이너 기동 시 마이그레이션 + 서버 실행
CMD ["bash", "-c", "bundle exec rails db:migrate && bundle exec rails server -b 0.0.0.0 -p 3000"]