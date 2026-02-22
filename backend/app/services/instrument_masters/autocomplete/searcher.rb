# frozen_string_literal: true

module InstrumentMasters
  module Autocomplete
    class Searcher
      LIMIT = 10
      CANDIDATE = 30

      def search(q:, provider:)
        q = q.to_s.strip
        return [] if q.length < Normalizer::MIN

        # ✅ prefix는 MAX까지로 자름 (길게 쳐도 인덱스 키는 2~5만 존재)
        # 예: "aapl" -> "aapl"(len4)
        # 예: "apple" -> "apple"[0,5] => "apple"(len5)
        prefix = normalized_prefix(q, provider)

        sym_ids = fetch_ids(provider: provider, kind: "sym", prefix: prefix)
        name_ids = fetch_ids(provider: provider, kind: "name", prefix: prefix)

        # ✅ 심볼 먼저 + 이름 보조 (중복 제거)
        merged_ids = (sym_ids + name_ids).uniq.first(CANDIDATE)
        return [] if merged_ids.empty?

        # DB 조회
        rows = ::InstrumentMaster
          .where(id: merged_ids)
          .select(:id, :provider, :symbol, :name_en, :name_jp, :exchange, :security_type, :jpx_section)
          .index_by(&:id)

        # ✅ 정렬: 심볼 후보가 먼저 오도록 (sym_ids 순서 유지)
        ordered = []
        sym_ids.each { |id| ordered << rows[id] if rows[id] }
        name_ids.each { |id| ordered << rows[id] if rows[id] && !sym_ids.include?(id) }

        ordered.compact.first(LIMIT).map { |m| serialize(m) }
      end

      private

      def normalized_prefix(q, provider)
        # 심볼/이름 둘 다 조회하므로
        # 1) 심볼 prefix는 upcase
        # 2) 이름 prefix는 downcase(영문), 일본어는 원문
        #
        # 여기서는 "키"를 하나로 쓰기 위해:
        # - q에 영문이 섞이면 downcase를 기준으로 prefix 생성
        # - 심볼 조회는 upcase 버전 prefix로도 추가 조회가 필요하지만,
        #   우리가 인덱싱 때 심볼은 upcase로만 만들었으니,
        #   여기서는 sym용 prefix는 upcase로 따로 변환해서 fetch_ids에서 처리함.
        #
        # 따라서 여기서는 원본 prefix 길이만 결정하는 용도
        q2 = q.gsub(/\s+/, " ")
        max = Normalizer::MAX
        q2.length > max ? q2[0, max] : q2
      end

      def fetch_ids(provider:, kind:, prefix:)
        InstrumentMasters::RedisStore::Client.with do |r|
          pfx =
            if kind == "sym"
              Normalizer.normalize_symbol(prefix)
            else
              # 이름은 영문이면 downcase로 들어가고, 일본어는 변화 없음
              prefix.to_s.strip.downcase
            end

          key = KeyBuilder.zset_key(provider: provider, kind: kind, prefix: pfx)
          # 높은 score 먼저
          r.zrevrange(key, 0, CANDIDATE - 1).map(&:to_i)
        end
      rescue => e
        Rails.logger.warn("[Autocomplete] redis fetch failed kind=#{kind} err=#{e.class}: #{e.message}")
        []
      end

      def serialize(m)
        {
          id: m.id,
          provider: m.provider,
          symbol: m.symbol,
          name_en: m.name_en,
          name_jp: m.name_jp,
          exchange: m.exchange,
          security_type: m.security_type,
          jpx_section: m.jpx_section
        }
      end
    end
  end
end
