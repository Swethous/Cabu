# frozen_string_literal: true

module Api
  module V1
    class AutocompleteController < ApplicationController
      skip_before_action :authenticate_user!, only: [:index]
      # GET /api/v1/autocomplete?q=app&provider=NASDAQ
      def index
        q = params[:q].to_s
        provider = params[:provider].to_s.presence

        items = InstrumentMasters::Autocomplete::Searcher.new.search(q: q, provider: provider)

        render json: { items: items }
      end
    end
  end
end