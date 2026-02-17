# frozen_string_literal: true
require "net/http"
require "json"

module Wikidata
  class Client
    WDQS_URL = "https://query.wikidata.org/sparql"
    API_URL  = "https://www.wikidata.org/w/api.php"

    USER_AGENT = "stock-community/1.0 (contact: dev@example.com)"

    def self.sparql_json(query)
      uri = URI(WDQS_URL)
      uri.query = URI.encode_www_form(query: query, format: "json")

      get_json(
        uri,
        headers: { "Accept" => "application/sparql-results+json" }
      )
    end

    # QID -> { "ja" => "...", "en" => "..." } (labels + sitelinks title)
    def self.entity_names(qid)
      uri = URI(API_URL)
      uri.query = URI.encode_www_form(
        action: "wbgetentities",
        ids: qid,
        format: "json",
        props: "labels|sitelinks",
        languages: "ja|en",
        sitefilter: "jawiki|enwiki"
      )

      json = get_json(uri)
      return {} unless json

      ent = json.dig("entities", qid) || {}

      ja_title = ent.dig("sitelinks", "jawiki", "title")
      en_title = ent.dig("sitelinks", "enwiki", "title")

      labels = ent["labels"] || {}
      ja_label = labels.dig("ja", "value")
      en_label = labels.dig("en", "value")

      out = {}
      out["ja"] = (ja_title.presence || ja_label.presence)
      out["en"] = (en_title.presence || en_label.presence)
      out.compact
    rescue StandardError
      {}
    end

    def self.get_json(uri, headers: {})
      req = Net::HTTP::Get.new(uri)
      req["User-Agent"] = USER_AGENT
      req["Accept"] = "application/json"
      headers.each { |k, v| req[k] = v }

      res = Net::HTTP.start(
        uri.host, uri.port,
        use_ssl: uri.scheme == "https",
        open_timeout: 3,
        read_timeout: 6
      ) { |http| http.request(req) }

      return nil unless res.is_a?(Net::HTTPSuccess)
      JSON.parse(res.body)
    rescue JSON::ParserError
      nil
    rescue StandardError
      nil
    end
  end
end