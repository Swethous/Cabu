# frozen_string_literal: true

module InstrumentMasters
  module Autocomplete
    module KeyBuilder
      module_function

      # ✅ 버전 키: 인덱스 rebuild하면 version을 올리고, 검색은 최신 버전만 봄
      VERSION_KEY = "ac:v"

      # provider 별 prefix index
      # 예: ac:1:NASDAQ:sym:aa
      # 예: ac:1:JPX:name:to
      def zset_key(provider:, kind:, prefix:)
        v = current_version
        "ac:#{v}:#{provider}:#{kind}:#{prefix}"
      end

      def current_version
        InstrumentMasters::RedisStore::Client.with do |r|
          v = r.get(VERSION_KEY)
          (v.presence || "1").to_i
        end
      rescue
        1
      end

      def bump_version!
        InstrumentMasters::RedisStore::Client.with do |r|
          r.incr(VERSION_KEY)
        end
      end
    end
  end
end
