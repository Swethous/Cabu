# frozen_string_literal: true

class UpdatePopularRankingsWorker
  include Sidekiq::Worker

  sidekiq_options queue: :default, retry: 2

  def perform
    UpdatePopularRankingsJob.perform_now
  end
end
