class Project < ApplicationRecord
  belongs_to :user

  # Admin (User) who created the project
  belongs_to :created_by, class_name: "User", optional: true

  has_many_attached :files

  STATUSES = %w[
    draft
    acquiring_permits
    production
    installation
    complete
    cancelled
  ].freeze

  validates :name, presence: true
  validates :status, inclusion: { in: STATUSES }, allow_nil: true
  validates :install_slot, inclusion: { in: %w[am pm] }, allow_nil: true

  # Customer can schedule when project is in Installation phase
  def installable?
    status == "installation"
  end
end
