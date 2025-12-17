module Api
  module V1
    module Admin
      class ScheduleController < ApplicationController
        before_action :authenticate_user!
        before_action :require_admin!

        # GET /api/v1/admin/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD
        #
        # For each day, we return two slots:
        #  - "am":  8:00 AM – 12:00 PM
        #  - "pm": 12:00 PM – 4:00 PM
        # Only the next 30 days from today are "bookable".
        #
        def index
          from_date =
            if params[:from].present?
              Date.parse(params[:from])
            else
              Date.today
            end

          to_date =
            if params[:to].present?
              Date.parse(params[:to])
            else
              Date.today + 29.days # 30 days including today
            end

          # Only these days should be bookable
          limit_start = Date.today
          limit_end   = Date.today + 29.days

          # Get counts per [install_date, install_slot] in the range
          projects_in_range = Project.where(install_date: from_date..to_date)
          counts = projects_in_range.group(:install_date, :install_slot).count

          days = (from_date..to_date).map do |date|
            am_count = counts[[date, "am"]] || 0
            pm_count = counts[[date, "pm"]] || 0

            bookable = (date >= limit_start && date <= limit_end)

            {
              date: date,
              bookable: bookable,
              slots: [
                {
                  key: "am",
                  label: "8:00 AM – 12:00 PM",
                  scheduled_count: am_count,
                  capacity: 1,
                  is_full: am_count >= 1,
                  bookable: bookable
                },
                {
                  key: "pm",
                  label: "12:00 PM – 4:00 PM",
                  scheduled_count: pm_count,
                  capacity: 1,
                  is_full: pm_count >= 1,
                  bookable: bookable
                }
              ]
            }
          end

          render json: days, status: :ok
        rescue ArgumentError => e
          render json: { error: "Invalid date range: #{e.message}" }, status: :unprocessable_entity
        end
      end
    end
  end
end
