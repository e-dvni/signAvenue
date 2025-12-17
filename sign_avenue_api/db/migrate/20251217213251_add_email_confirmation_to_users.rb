class AddEmailConfirmationToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :email_confirmed_at, :datetime
    add_column :users, :email_confirmation_code_digest, :string
    add_column :users, :email_confirmation_sent_at, :datetime
    add_column :users, :email_confirmation_expires_at, :datetime
    add_column :users, :email_confirmation_window_started_at, :datetime
    add_column :users, :email_confirmation_send_count, :integer, default: 0, null: false

    add_index :users, :email_confirmed_at
  end
end
