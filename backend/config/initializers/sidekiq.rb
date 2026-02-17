# frozen_string_literal: true

require "erb"

require "yaml"

require "sidekiq/cron/job"

redis_url = ENV["REDIS_SIDEKIQ_URL"].presence || ENV["REDIS_URL"].presence

# Sidekiq "서버(=워커 프로세스)" 설정
# - 서버는 실제로 job을 실행하는 프로세스임
Sidekiq.configure_server do |config|
  # Sidekiq 서버가 사용할 Redis 연결 설정
  config.redis = { url: redis_url } if redis_url.present?

  # Sidekiq 서버가 부팅(시작)할 때 1번 실행되는 훅
  config.on(:startup) do
    # 주기 스케줄을 정의한 YAML 파일 경로
    schedule_file = Rails.root.join("config/sidekiq_schedule.yml")
    # 파일이 없으면 아무 것도 하지 않고 종료
    next unless schedule_file.exist?

    # YAML 파일을 읽어서(문자열) → ERB 렌더링 → YAML 파싱
    # - ERB.new(...).result : <%= ENV["XXX"] %> 같은 템플릿 처리
    # - YAML.safe_load : 안전하게 YAML 로드(임의 객체 로딩 방지)
    # - aliases: true : YAML 앵커(&, *) 같은 alias 기능 허용
    schedule = YAML.safe_load(
      ERB.new(schedule_file.read).result,
      aliases: true
    ) || {}

    # 파싱된 schedule 해시를 sidekiq-cron에 등록
    # 등록되면 cron 규칙에 따라 주기적으로 job이 enqueue됨
    Sidekiq::Cron::Job.load_from_hash!(schedule) if schedule.any?
  end
end

# Sidekiq "클라이언트(=enqueue만 하는 쪽)" 설정
# - Rails 웹 서버(컨트롤러 등)에서 perform_later로 job을 큐에 넣을 때 이 설정이 적용됨
Sidekiq.configure_client do |config|
  # 클라이언트도 같은 Redis를 바라보게 설정
  # (웹이 넣은 job을 워커가 같은 Redis에서 꺼내야 하므로 중요)
  config.redis = { url: redis_url } if redis_url.present?
end