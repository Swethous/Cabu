# frozen_string_literal: true

class ImportNasdaqListedInstrumentMastersJob < ApplicationJob
  queue_as :default

  DEFAULT_DIR  = Rails.root.join("db/data/nasdaq").to_s
  DEFAULT_PATH = Rails.root.join("db/data/nasdaq/nasdaqlisted.txt").to_s

  # FTP에서 최신 파일 받아서(덮어쓰기) -> import
  NASDAQ_LISTED_URL = "ftp://ftp.nasdaqtrader.com/symboldirectory/nasdaqlisted.txt"

  def perform(path: DEFAULT_PATH, download: true)
    FileUtils.mkdir_p(DEFAULT_DIR)

    if download
      Rails.logger.info("[NASDAQ ImportJob] downloading url=#{NASDAQ_LISTED_URL} -> #{path}")
      ok = system("curl", "-L", "-o", path, NASDAQ_LISTED_URL)
      raise "NASDAQ download failed" unless ok && File.exist?(path)
    end

    Rails.logger.info("[NASDAQ ImportJob] start import path=#{path}")

    importer = InstrumentMasters::NasdaqListedTxtImporter.new
    result = importer.call(path: path)

    Rails.logger.info("[NASDAQ ImportJob] done result=#{result.inspect}")
    result
  end
end
