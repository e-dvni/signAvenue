class CreateProjects < ActiveRecord::Migration[8.1]
  def change
    create_table :projects do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name
      t.string :status
      t.string :location
      t.date :install_date
      t.text :description

      t.timestamps
    end
  end
end
