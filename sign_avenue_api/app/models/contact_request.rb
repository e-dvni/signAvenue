class ContactRequest < ApplicationRecord
  
  has_one_attached :file
  # later we can add validations like:
  # validates :name, :email, :message, presence: true
end
