class AddCreatedByToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :created_by_id, :bigint
    add_index :projects, :created_by_id
    add_foreign_key :projects, :users, column: :created_by_id
  end
end
