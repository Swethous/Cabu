# frozen_string_literal: true

class RenameStockNameKrToNameJp < ActiveRecord::Migration[7.2]
  def change
    # name_kr -> name_jp
    rename_column :stocks, :name_kr, :name_jp
  end
end