# frozen_string_literal: true

module InstrumentMasters
  module Autocomplete
    module Normalizer
      module_function

      MIN = 2
      MAX = 5

      # ✅ 심볼용: AAPL, 7203.T 같은 값에서 prefix 생성
      # - 대문자 고정
      # - 공백 제거
      def normalize_symbol(s)
        s.to_s.strip.upcase
      end

      # ✅ 이름용:
      # - 영문은 downcase해서 prefix 생성 (대소문자 무시)
      # - 일본어는 원문 그대로(대소문자 개념 없음)
      # - 불필요한 연속 공백 정리
      def normalize_name(s, locale: :en)
        str = s.to_s.strip.gsub(/\s+/, " ")
        return str if locale == :jp
        str.downcase
      end

      # ✅ prefix 리스트 생성: MIN..MAX, 단 원문 길이보다 길면 stop
      def prefixes(normalized_str)
        str = normalized_str.to_s
        out = []
        (MIN..MAX).each do |len|
          break if str.length < len
          out << str[0, len]
        end
        out
      end
    end
  end
end
