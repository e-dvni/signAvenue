class Project < ApplicationRecord
  belongs_to :user
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

  # keep if you still use install_slot somewhere
  validates :install_slot, inclusion: { in: %w[am pm] }, allow_nil: true

  # ✅ customers can schedule only in Installation stage
  def installable?
    status == "installation"
  end
end
