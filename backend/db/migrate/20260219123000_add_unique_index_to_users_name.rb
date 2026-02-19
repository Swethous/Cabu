class AddUniqueIndexToUsersName < ActiveRecord::Migration[7.2]
  def change
    add_index :users, "LOWER(name)", unique: true, name: "index_users_on_lower_name"
  end
end
