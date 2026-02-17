# frozen_string_literal: true

module Wikidata
  class NameResolver
    TSE_QID    = "Q217475"
    NASDAQ_QID = "Q82059"
    NYSE_QID   = "Q13677"

    SUCCESS_TTL = 30.days
    FAIL_TTL    = 2.hours
    NIL_SENTINEL = "__nil__"
    CACHE_VERSION = "v2"

    def self.resolve(symbol:)
      symbol = symbol.to_s.strip
      return nil if symbol.empty?

      key = "wikidata:names:#{CACHE_VERSION}:#{symbol}"

      cached = Rails.cache.read(key)
      return nil if cached == NIL_SENTINEL
      return cached if cached.is_a?(Hash)

      names = resolve_uncached(symbol)

      if names.present?
        Rails.cache.write(key, names, expires_in: SUCCESS_TTL)
        names
      else
        Rails.cache.write(key, NIL_SENTINEL, expires_in: FAIL_TTL)
        nil
      end
    end

    def self.resolve_uncached(symbol)
      ticker, exchanges = parse_symbol(symbol)
      qid = find_qid(ticker: ticker, exchanges: exchanges)
      return nil unless qid

      raw = Wikidata::Client.entity_names(qid)
      out = {}
      out[:ja] = raw["ja"] if raw["ja"].present?
      out[:en] = raw["en"] if raw["en"].present?
      out.presence
    rescue StandardError
      nil
    end

    def self.parse_symbol(symbol)
      if symbol.end_with?(".T")
        [symbol.delete_suffix(".T"), [TSE_QID]]
      else
        [symbol, [NASDAQ_QID, NYSE_QID]]
      end
    end

    def self.find_qid(ticker:, exchanges:)
      # 1) exchange statement + qualifier ticker
      exchanges.each do |exchange_qid|
        qid = sparql_find_qid_by_exchange_qualifier(ticker: ticker, exchange_qid: exchange_qid)
        return qid if qid
      end

      # 2) fallback: wdt:P249 = ticker
      sparql_find_qid_by_p249(ticker: ticker)
    end

    def self.sparql_find_qid_by_exchange_qualifier(ticker:, exchange_qid:)
      query = <<~SPARQL
        SELECT ?item WHERE {
          ?item p:P414 ?st .
          ?st ps:P414 wd:#{exchange_qid} ;
              pq:P249 "#{escape_sparql(ticker)}" .
        }
        LIMIT 1
      SPARQL
      extract_qid(Wikidata::Client.sparql_json(query))
    rescue StandardError
      nil
    end

    def self.sparql_find_qid_by_p249(ticker:)
      query = <<~SPARQL
        SELECT ?item WHERE {
          ?item wdt:P249 "#{escape_sparql(ticker)}" .
        }
        LIMIT 1
      SPARQL
      extract_qid(Wikidata::Client.sparql_json(query))
    rescue StandardError
      nil
    end

    def self.extract_qid(json)
      url = json&.dig("results", "bindings")&.first&.dig("item", "value")
      return nil unless url
      url.split("/").last
    end

    def self.escape_sparql(str)
      str.to_s.gsub("\\", "\\\\").gsub('"', '\"')
    end

    private_class_method :resolve_uncached, :parse_symbol, :find_qid,
                         :sparql_find_qid_by_exchange_qualifier, :sparql_find_qid_by_p249,
                         :extract_qid, :escape_sparql
  end
end