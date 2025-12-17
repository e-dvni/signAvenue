class SetDefaultRoleOnUsers < ActiveRecord::Migration[8.1]
  def up
    change_column_default :users, :role, "customer"
    execute "UPDATE users SET role = 'customer' WHERE role IS NULL"
  end

  def down
    change_column_default :users, :role, nil
  end
end
