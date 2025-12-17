class CreateContactRequests < ActiveRecord::Migration[7.1]
  def change
    create_table :contact_requests do |t|
      t.string :name
      t.string :email
      t.string :phone
      t.string :business_name
      t.string :city
      t.text :message
      t.string :status

      t.timestamps
    end
  end
end
