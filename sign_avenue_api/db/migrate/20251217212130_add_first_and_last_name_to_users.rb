class AddFirstAndLastNameToUsers < ActiveRecord::Migration[8.1]
  def up
    add_column :users, :first_name, :string
    add_column :users, :last_name, :string

    # Backfill from existing `name` ("First Last")
    User.reset_column_information
    User.where(first_name: nil, last_name: nil).find_each do |u|
      next if u.name.blank?
      parts = u.name.strip.split(/\s+/)
      u.first_name = parts.first
      u.last_name  = parts[1..].join(" ")
      u.save!(validate: false)
    end
  end

  def down
    remove_column :users, :first_name
    remove_column :users, :last_name
  end
end
