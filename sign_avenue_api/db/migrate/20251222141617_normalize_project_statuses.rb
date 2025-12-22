class NormalizeProjectStatuses < ActiveRecord::Migration[8.1]
  def up
    # map old -> new
    mapping = {
      "draft" => "draft",
      "quote_sent" => "acquiring_permits",
      "in_production" => "production",
      "ready_for_install" => "installation",
      "scheduled" => "installation",
      "installed" => "complete",
      "completed" => "complete",
      "cancelled" => "cancelled"
    }

    Project.reset_column_information

    Project.find_each do |p|
      next if p.status.blank?
      new_status = mapping[p.status] || "draft"
      p.update_columns(status: new_status) # bypass validation during migration
    end
  end

  def down
    # Optional: you can decide not to reverse or implement reverse mapping.
    # Keeping it simple:
    # no-op
  end
end
