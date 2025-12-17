class AddDefaultToUserRole < ActiveRecord::Migration[8.1]
  def change
  end
end
class AddDefaultToUsersRole < ActiveRecord::Migration[8.1]
  def up
    # Set default for new users
    change_column_default :users, :role, "customer"

    # Backfill existing users with nil role
    execute <<~SQL
      UPDATE users
      SET role = 'customer'
      WHERE role IS NULL;
    SQL
  end

  def down
    change_column_default :users, :role, nil
  end
end
