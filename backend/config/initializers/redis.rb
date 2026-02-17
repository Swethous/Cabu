# frozen_string_literal: true

require Rails.root.join("lib/instrument_masters/redis_store/client")

redis_url = ENV["REDIS_URL"]
return if redis_url.blank?

InstrumentMasters::RedisStore::Client.configure!(
  url: redis_url,
  size: Integer(ENV.fetch("REDIS_POOL_SIZE", 5)),
  timeout: Integer(ENV.fetch("REDIS_POOL_TIMEOUT", 5))
)