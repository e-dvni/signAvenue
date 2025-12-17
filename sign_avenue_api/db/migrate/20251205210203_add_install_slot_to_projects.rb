class AddInstallSlotToProjects < ActiveRecord::Migration[8.1]
  def change
    add_column :projects, :install_slot, :string
  end
end
