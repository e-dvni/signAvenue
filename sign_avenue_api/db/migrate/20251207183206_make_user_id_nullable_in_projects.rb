class MakeUserIdNullableInProjects < ActiveRecord::Migration[7.1]
  def change
    change_column_null :projects, :user_id, true
  end
end
