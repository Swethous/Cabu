# lib/instrument_masters/redis_store/client.rb
# frozen_string_literal: true

require "redis"
require "connection_pool"

module InstrumentMasters
  module RedisStore
    class Client
      class << self
        def configure!(url:, size: 5, timeout: 5)
          @pool = ConnectionPool.new(size: size, timeout: timeout) do
            ::Redis.new(url: url)
          end
        end

        def with(&block)
          raise "Redis not configured" unless @pool
          @pool.with(&block)
        end
      end
    end
  end
end