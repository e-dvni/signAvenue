class User < ApplicationRecord
  has_secure_password

  has_many :projects, dependent: :nullify

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true

  # roles: "customer", "admin" later
end
