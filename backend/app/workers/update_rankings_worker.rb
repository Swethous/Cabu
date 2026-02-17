# frozen_string_literal: true

class UpdateRankingsWorker
  include Sidekiq::Worker

  sidekiq_options queue: :default, retry: 2

  def perform
    UpdateRankingsJob.perform_now
  end
end
