# frozen_string_literal: true

module InstrumentMasters
  module Autocomplete
    class Indexer
      DEFAULT_CAP = 200
      DEFAULT_BATCH_SIZE = 2000
      DEFAULT_KINDS = %w[sym name].freeze

      def initialize(
        provider:,
        kinds: DEFAULT_KINDS,
        cap: DEFAULT_CAP,
        batch_size: DEFAULT_BATCH_SIZE,
        sleep_sec: 0.0,
        start_id: nil,
        end_id: nil,
        log_every: 0
      )
        @provider = provider
        @kinds = Array(kinds).map(&:to_s)
        @cap = cap.to_i
        @batch_size = batch_size.to_i
        @sleep_sec = sleep_sec.to_f
        @start_id = start_id&.to_i
        @end_id = end_id&.to_i
        @log_every = log_every.to_i
      end

      # ✅ provider 단위로 전체 재구축
      def rebuild!
        index_provider!(@provider)
      end

      private

      def index_provider!(provider)
        scope = ::InstrumentMaster.where(provider: provider, is_active: true)
        scope = scope.where("id >= ?", @start_id) if @start_id
        scope = scope.where("id <= ?", @end_id) if @end_id

        processed = 0

        InstrumentMasters::RedisStore::Client.with do |r|
          scope.find_in_batches(batch_size: @batch_size) do |batch|
            batch.each do |m|
              index_one!(r, provider: provider, m: m)

              processed += 1
              if @log_every > 0 && (processed % @log_every).zero?
                Rails.logger.info("[AutocompleteIndex] provider=#{provider} processed=#{processed} last_id=#{m.id}")
              end
            end

            sleep(@sleep_sec) if @sleep_sec > 0
          end
        end

        Rails.logger.info("[AutocompleteIndex] provider=#{provider} done processed=#{processed} range=#{@start_id || '-'}..#{@end_id || '-'} kinds=#{@kinds} cap=#{@cap}")
        true
      end

      def index_one!(redis, provider:, m:)
        if @kinds.include?("sym")
          sym = Normalizer.normalize_symbol(m.symbol)
          Normalizer.prefixes(sym).each do |pfx|
            key = KeyBuilder.zset_key(provider: provider, kind: "sym", prefix: pfx)
            zadd_capped(redis, key, m.id, 100)
          end
        end

        if @kinds.include?("name")
          if m.name_en.present?
            name = Normalizer.normalize_name(m.name_en, locale: :en)
            Normalizer.prefixes(name).each do |pfx|
              key = KeyBuilder.zset_key(provider: provider, kind: "name", prefix: pfx)
              zadd_capped(redis, key, m.id, 10)
            end
          end

          if m.name_jp.present?
            name = Normalizer.normalize_name(m.name_jp, locale: :jp)
            Normalizer.prefixes(name).each do |pfx|
              key = KeyBuilder.zset_key(provider: provider, kind: "name", prefix: pfx)
              zadd_capped(redis, key, m.id, 10)
            end
          end
        end
      end

      def zadd_capped(redis, key, member_id, score)
        redis.zadd(key, score, member_id)

        size = redis.zcard(key)
        cap = @cap
        if size > cap
          redis.zremrangebyrank(key, cap, -1)
        end
      end
    end
  end
end