class WidenChangePercentInStockSnapshots < ActiveRecord::Migration[7.2]
  def change
    change_column :stock_snapshots, :change_percent, :decimal, precision: 12, scale: 6
  end
end