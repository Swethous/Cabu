class ApplicationJob < ActiveJob::Base
  # Automatically retry jobs that encountered a deadlock
  # retry_on ActiveRecord::Deadlocked

  # Most jobs are safe to ignore if the underlying records are no longer available
  # discard_on ActiveJob::DeserializationError
end

# job active command
# fly ssh console -a stock-community
# bin/rails runner "UpdateSparklineCandlesJob.perform_now"
