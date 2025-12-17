class Project < ApplicationRecord
  belongs_to :user

  # You can tweak these later if you want more/less states
  STATUSES = %w[
    draft
    quote_sent
    in_production
    ready_for_install
    scheduled
    installed
    completed
    cancelled
  ].freeze

  validates :name, presence: true
  validates :status, inclusion: { in: STATUSES }, allow_nil: true

  # Only two valid customer-facing install slots
  validates :install_slot, inclusion: { in: %w[am pm] }, allow_nil: true

  # Helper: is this project allowed to be scheduled by the customer?
  def installable?
    status == "ready_for_install"
  end
end
