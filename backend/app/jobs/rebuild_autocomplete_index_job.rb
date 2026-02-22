# frozen_string_literal: true

class RebuildAutocompleteIndexJob < ApplicationJob
  queue_as :default

  def perform(
    providers: %w[JPX NASDAQ_LISTED],
    kinds: %w[sym name],
    cap: 200,
    batch_size: 2000,
    sleep_sec: 0.0,
    start_id: nil,
    end_id: nil,
    log_every: 0,
    bump_version: true
  )
    if bump_version
      new_version = InstrumentMasters::Autocomplete::KeyBuilder.bump_version!
      Rails.logger.info("[AutocompleteIndex] bump version => #{new_version}")
    end

    providers.each do |provider|
      Rails.logger.info("[AutocompleteIndex] rebuild provider=#{provider} kinds=#{kinds} cap=#{cap} range=#{start_id || '-'}..#{end_id || '-'}")

      InstrumentMasters::Autocomplete::Indexer.new(
        provider: provider,
        kinds: kinds,
        cap: cap,
        batch_size: batch_size,
        sleep_sec: sleep_sec,
        start_id: start_id,
        end_id: end_id,
        log_every: log_every
      ).rebuild!

      Rails.logger.info("[AutocompleteIndex] done provider=#{provider}")
    end

    Rails.logger.info("[AutocompleteIndex] all done providers=#{providers.inspect}")
    true
  end
end
