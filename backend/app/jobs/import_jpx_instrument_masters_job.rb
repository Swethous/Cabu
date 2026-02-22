# frozen_string_literal: true

class ImportJpxInstrumentMastersJob < ApplicationJob
  queue_as :default

  DEFAULT_DIR = Rails.root.join("db", "data", "jpx").to_s

  # path를 주면 그 파일로, 없으면 DEFAULT_DIR에서 최신 CSV 자동 선택
  def perform(path: nil, dir: DEFAULT_DIR)
    csv_path = path.presence || find_latest_csv!(dir)

    Rails.logger.info("[JPX ImportJob] start path=#{csv_path}")

    importer = InstrumentMasters::JpxCsvImporter.new
    result = importer.call(path: csv_path)

    Rails.logger.info("[JPX ImportJob] done inserted=#{result[:inserted]} path=#{result[:path]}")
    result
  end

  private

  def find_latest_csv!(dir)
    files = Dir.glob(File.join(dir, "*.csv"))
    raise "JPX CSV not found in dir=#{dir}" if files.empty?

    files.max_by { |f| File.mtime(f) }
  end
end
