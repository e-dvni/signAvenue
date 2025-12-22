module Api
  module V1
    module Admin
      class ContactRequestsController < ApplicationController
        include Rails.application.routes.url_helpers

        before_action :authenticate_user!
        before_action :require_admin!

        # GET /api/v1/admin/contact_requests
        def index
          requests = ContactRequest.order(created_at: :desc)

          render json: requests.map { |cr| contact_request_json(cr) }, status: :ok
        end

        # GET /api/v1/admin/contact_requests/:id
        # Viewing a request will mark it as opened (status: "opened")
        def show
          cr = ContactRequest.find_by(id: params[:id])
          return render json: { error: "Contact request not found" }, status: :not_found unless cr

          # Auto-mark as opened if it's new/unopened
          if cr.status.blank? || cr.status.to_s.downcase.in?(%w[new unopened])
            cr.update(status: "opened")
          end

          render json: contact_request_json(cr), status: :ok
        end

        # PATCH/PUT /api/v1/admin/contact_requests/:id
        def update
          cr = ContactRequest.find_by(id: params[:id])
          return render json: { error: "Contact request not found" }, status: :not_found unless cr

          if cr.update(contact_request_params)
            render json: contact_request_json(cr), status: :ok
          else
            render json: { errors: cr.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

        def contact_request_params
          params.require(:contact_request).permit(:status)
        end

        def contact_request_json(cr)
          cr.as_json.merge(
            file_url: cr.file.attached? ? url_for(cr.file) : nil
          )
        end
      end
    end
  end
end
