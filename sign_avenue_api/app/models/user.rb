require "securerandom"
require "bcrypt"

class User < ApplicationRecord
  has_secure_password

  has_many :projects, dependent: :nullify

  # ---- Constants ----
  CODE_TTL = 10.minutes
  CODE_LIMIT_PER_HOUR = 5

  # ---- Validations ----
  validates :email, presence: true, uniqueness: true
  validates :name, presence: true

  # ---- Defaults / normalization ----
  before_validation :set_default_role, on: :create
  before_validation :sync_name_from_parts

  # ---- Email confirmation helpers ----
  def email_confirmed?
    email_confirmed_at.present?
  end

  # Rolling window: 5 codes per hour
  def can_send_confirmation_code?
    now = Time.current

    # Reset rolling window if missing or older than 1 hour
    if email_confirmation_window_started_at.nil? || email_confirmation_window_started_at < now - 1.hour
      self.email_confirmation_window_started_at = now
      self.email_confirmation_send_count = 0
    end

    email_confirmation_send_count.to_i < CODE_LIMIT_PER_HOUR
  end

  # Generates a 6-digit code, stores a bcrypt digest, sets expiry, increments send count
  # Returns the plaintext code (for emailing).
  def generate_and_store_confirmation_code!
    code = format("%06d", SecureRandom.random_number(1_000_000))
    digest = BCrypt::Password.create(code)

    now = Time.current

    self.email_confirmation_code_digest = digest
    self.email_confirmation_sent_at = now
    self.email_confirmation_expires_at = now + CODE_TTL

    self.email_confirmation_window_started_at ||= now
    self.email_confirmation_send_count = email_confirmation_send_count.to_i + 1

    save!
    code
  end

  # Verifies code, checks expiry, and confirms email.
  # Returns true/false.
  def verify_confirmation_code!(code)
    return false if email_confirmation_code_digest.blank?
    return false if email_confirmation_expires_at.blank?
    return false if Time.current > email_confirmation_expires_at

    submitted = code.to_s.strip
    return false if submitted.blank?

    ok = BCrypt::Password.new(email_confirmation_code_digest) == submitted
    return false unless ok

    update!(
      email_confirmed_at: Time.current,
      email_confirmation_code_digest: nil,
      email_confirmation_expires_at: nil
    )

    true
  end

  private

  def set_default_role
    self.role ||= "customer"
  end

  # If first_name/last_name exist in the schema and are provided,
  # keep `name` consistent for display/backwards compatibility.
  def sync_name_from_parts
    return unless respond_to?(:first_name) && respond_to?(:last_name)

    if first_name.present? || last_name.present?
      self.name = [first_name, last_name].compact.join(" ").strip
    end
  end
end
