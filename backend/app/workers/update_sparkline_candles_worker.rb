# frozen_string_literal: true

class UpdateSparklineCandlesWorker
  include Sidekiq::Worker

  sidekiq_options queue: :default, retry: 2

  def perform
    UpdateSparklineCandlesJob.perform_now
  end
end
