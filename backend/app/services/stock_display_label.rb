# frozen_string_literal: true

class StockDisplayLabel
  # 表示ルール:
  # - US: 日本語名(SYMBOL) 例: アップル(AAPL)
  # - JP(.T): 日本語名(英語ブランド) 例: トヨタ(Toyota)
  # - overrideがあれば最優先（names[:ja] に入れて使う想定）
  def self.build(symbol:, names:, meta_name: nil)
    symbol = symbol.to_s.strip

    ja = names&.dig(:ja) || names&.dig("ja")
    en = names&.dig(:en) || names&.dig("en")

    meta_short = meta_name&.dig(:short) || meta_name&.dig("short")
    meta_long  = meta_name&.dig(:long)  || meta_name&.dig("long")

    en ||= meta_long.presence || meta_short.presence
    brand = simplify_brand(en)

    if symbol.end_with?(".T")
      left  = simplify_ja(ja) || brand || symbol
      right = brand || symbol
      "#{left}(#{right == left ? symbol : right})"
    else
      left = simplify_ja(ja) || brand || symbol
      "#{left}(#{symbol})"
    end
  end

  def self.simplify_brand(en_name)
    return nil if en_name.blank?
    s = en_name.to_s.strip
    s = s.split(",").first
    s = s.split("(").first
    s.strip.split(/\s+/).first # "Toyota Motor Corporation" -> "Toyota"
  end

  def self.simplify_ja(ja_name)
    return nil if ja_name.blank?
    s = ja_name.to_s.strip
    # 최소한의 정리(과하게 줄이면 오히려 부정확해져서 여기선 약하게)
    s.gsub(/株式会社|（株）|\(株\)/, "").strip.presence || ja_name
  end

  private_class_method :simplify_brand, :simplify_ja
end